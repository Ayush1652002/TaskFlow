const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logActivity = require('../utils/logActivity');

// POST /tasks/:workspaceId/:taskId/attachments
const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
  if (!task) {
    fs.unlink(req.file.path, () => {}); // don't leave an orphaned file on disk
    throw new AppError('Task not found', 404);
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
});

// DELETE /tasks/:workspaceId/:taskId/attachments/:attachmentId
const deleteAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
  if (!task) throw new AppError('Task not found', 404);

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) throw new AppError('Attachment not found', 404);

  const filePath = path.join(__dirname, '..', 'uploads', attachment.filename);
  fs.unlink(filePath, () => {}); // best-effort — don't fail the request if the file is already gone

  attachment.deleteOne();
  await task.save();

  res.json({ message: 'Attachment deleted' });
});

module.exports = { uploadAttachment, deleteAttachment };
