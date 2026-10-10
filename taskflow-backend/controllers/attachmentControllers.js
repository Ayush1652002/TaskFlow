const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logActivity = require('../utils/logActivity');
const canModifyTask = require('../utils/canModifyTask');
const { cloudinary } = require('../middleware/upload');

// Fallback directory for any legacy local uploads
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MAX_ATTACHMENTS_PER_TASK = 10;

// Deletes a stored file from Cloudinary (or local disk) without failing the request
const removeFile = async (fileIdentifier, filePath = null) => {
  if (!fileIdentifier && !filePath) return;

  // Cloudinary deletion
  if (fileIdentifier && typeof fileIdentifier === 'string' && fileIdentifier.includes('taskflow_attachments')) {
    try {
      const result = await cloudinary.uploader.destroy(fileIdentifier, { resource_type: 'image' });
      if (result.result !== 'ok') {
        await cloudinary.uploader.destroy(fileIdentifier, { resource_type: 'raw' });
      }
    } catch (_) {
      // Best-effort cleanup: never throw an unhandled rejection
    }
    return;
  }

  // Legacy local disk cleanup
  const targetPath = filePath || (fileIdentifier ? path.join(UPLOAD_DIR, path.basename(fileIdentifier)) : null);
  if (targetPath && fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
    } catch (_) {}
  }
};

// POST /tasks/:workspaceId/:taskId/attachments
const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  try {
    const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id, deletedAt: null });
    if (!task) throw new AppError('Task not found', 404);

    // Same rule as editing the task: creator, assignee, or manager/admin/owner
    if (!canModifyTask(req, task)) {
      throw new AppError('Only the assignee, creator, or a manager/admin/owner can attach files to this task', 403);
    }
    if (task.attachments.length >= MAX_ATTACHMENTS_PER_TASK) {
      throw new AppError(`A task can have at most ${MAX_ATTACHMENTS_PER_TASK} attachments`, 400);
    }

    const isRemoteUrl = req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'));
    const storedFilename = req.file.filename || path.basename(req.file.path || req.file.originalname);
    const storedUrl = isRemoteUrl ? req.file.path : null;

    task.attachments.push({
      filename: storedFilename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: storedUrl,
      uploadedBy: req.user.id,
    });
    await task.save();

    logActivity({
      workspace: req.workspace._id,
      task: task._id,
      user: req.user.id,
      type: 'task_updated',
      message: `attached "${req.file.originalname}" to "${task.title}"`,
    });

    res.status(201).json(task.attachments[task.attachments.length - 1]);
  } catch (err) {
    await removeFile(req.file.filename, req.file.path);
    throw err;
  }
});

// GET /tasks/:workspaceId/:taskId/attachments/:attachmentId
const downloadAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
  if (!task) throw new AppError('Task not found', 404);

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) throw new AppError('Attachment not found', 404);

  // Set response headers to force native browser "Save As" file download
  const safeFilename = encodeURIComponent(attachment.originalName);
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
  res.setHeader('Content-Type', 'application/octet-stream');

  // 1. Resolve Cloudinary / Remote file download ONLY if it's an HTTP/HTTPS URL
  let fileUrl = null;
  if (attachment.url && (attachment.url.startsWith('http://') || attachment.url.startsWith('https://'))) {
    fileUrl = attachment.url;
  } else if (attachment.filename && attachment.filename.startsWith('http')) {
    fileUrl = attachment.filename;
  } else if (attachment.filename && attachment.filename.includes('taskflow_attachments')) {
    fileUrl = cloudinary.url(attachment.filename, { resource_type: 'auto' });
  }

  if (fileUrl) {
    const client = fileUrl.startsWith('https') ? https : http;
    return client.get(fileUrl, (remoteStream) => {
      if (remoteStream.statusCode >= 300 && remoteStream.statusCode < 400 && remoteStream.headers.location) {
        return https.get(remoteStream.headers.location, (redirectStream) => {
          redirectStream.pipe(res);
        });
      }

      if (remoteStream.statusCode >= 400) {
        return res.status(404).json({ message: 'File is no longer available on cloud storage' });
      }

      remoteStream.pipe(res);
    }).on('error', (err) => {
      console.error('Remote download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to download attachment' });
      }
    });
  }

  // 2. Local disk file fallback
  const filename = attachment.filename || '';
  let filePath = path.join(UPLOAD_DIR, path.basename(filename));

  if (!fs.existsSync(filePath) && attachment.url && fs.existsSync(attachment.url)) {
    filePath = attachment.url;
  }

  if (!fs.existsSync(filePath)) {
    throw new AppError('File is no longer available', 404);
  }

  res.download(filePath, attachment.originalName);
});

// DELETE /tasks/:workspaceId/:taskId/attachments/:attachmentId
const deleteAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
  if (!task) throw new AppError('Task not found', 404);

  if (!canModifyTask(req, task)) {
    throw new AppError('Only the assignee, creator, or a manager/admin/owner can remove files from this task', 403);
  }

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) throw new AppError('Attachment not found', 404);

  await removeFile(attachment.filename, attachment.url);

  attachment.deleteOne();
  await task.save();

  res.json({ message: 'Attachment deleted' });
});

module.exports = { uploadAttachment, downloadAttachment, deleteAttachment };