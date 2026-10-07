const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logActivity = require('../utils/logActivity');
const canModifyTask = require('../utils/canModifyTask');
const { UPLOAD_DIR } = require('../middleware/upload');
// changed
const MAX_ATTACHMENTS_PER_TASK = 10;

// Deletes a stored file without ever failing the request.
const removeFile = (filePath) => fs.unlink(filePath, () => {});

// POST /tasks/:workspaceId/:taskId/attachments
// Note: multer has already saved the file to disk BEFORE this function runs,
// so every "no" answer below must delete that file again (no orphan files).
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

    task.attachments.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
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
    removeFile(req.file.path); // any failure: don't leave the file on disk
    throw err;
  }
});

// GET /tasks/:workspaceId/:taskId/attachments/:attachmentId
// Replaces the old public /uploads/<filename> link. The user must be logged in
// AND be a member of this workspace (checked by the route middleware), and the
// file must really belong to a task in THIS workspace.
const downloadAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
  if (!task) throw new AppError('Task not found', 404);

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) throw new AppError('Attachment not found', 404);

  // path.basename: the name comes from our own database, but never trust a path
  const filePath = path.join(UPLOAD_DIR, path.basename(attachment.filename));
  if (!fs.existsSync(filePath)) throw new AppError('File is no longer available', 404);

  // res.download sends "Content-Disposition: attachment", so the browser SAVES
  // the file instead of opening/running it, with the original file name.
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

  removeFile(path.join(UPLOAD_DIR, path.basename(attachment.filename))); // best-effort

  attachment.deleteOne();
  await task.save();

  res.json({ message: 'Attachment deleted' });
});

module.exports = { uploadAttachment, downloadAttachment, deleteAttachment };
