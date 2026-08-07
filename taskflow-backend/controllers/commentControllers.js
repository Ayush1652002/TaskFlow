const Comment = require('../models/Comment');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logActivity = require('../utils/logActivity');
const notify = require('../utils/notify');

// Finds @name tokens in the text and matches them against the workspace's
// member list (by name, case-insensitive) — good enough without needing a
// dedicated autocomplete-and-store-userId flow on the frontend yet.
const resolveMentions = (text, workspace) => {
  const tokens = [...text.matchAll(/@(\w+)/g)].map(m => m[1].toLowerCase());
  if (!tokens.length) return [];

  return workspace.members
    .filter(m => m.user.name && tokens.includes(m.user.name.split(' ')[0].toLowerCase()))
    .map(m => m.user._id);
};

// GET /tasks/:workspaceId/:taskId/comments
const getComments = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const comments = await Comment.find({ task: taskId, workspace: req.workspace._id })
    .populate('author', 'name')
    .sort({ createdAt: 1 });
  res.json(comments);
});

// POST /tasks/:workspaceId/:taskId/comments
const addComment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { text } = req.body;
  if (!text?.trim()) throw new AppError('Comment text is required', 400);

  const task = await Task.findOne({ _id: taskId, workspace: req.workspace._id });
  if (!task) throw new AppError('Task not found', 404);

  // req.workspace.members from workspaceAuth isn't populated with user names,
  // so re-fetch populated for mention-matching purposes.
  const populatedWorkspace = await req.workspace.populate('members.user', 'name');
  const mentions = resolveMentions(text, populatedWorkspace);

  const comment = await Comment.create({
    workspace: req.workspace._id,
    task: taskId,
    author: req.user.id,
    text: text.trim(),
    mentions,
  });

  await comment.populate('author', 'name');

  await logActivity({
    workspace: req.workspace._id,
    task: taskId,
    user: req.user.id,
    type: 'comment_added',
    message: `commented on "${task.title}"`,
  });

  mentions.forEach((mentionedUserId) => {
    notify({
      workspace: req.workspace._id,
      user: mentionedUserId,
      fromUser: req.user.id,
      task: taskId,
      type: 'mentioned',
      message: `mentioned you in a comment on "${task.title}"`,
    });
  });

  res.status(201).json(comment);
});

module.exports = { getComments, addComment };
