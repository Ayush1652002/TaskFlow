const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');

// GET /activity/:workspaceId — workspace-wide timeline, newest first, paginated
const getWorkspaceActivity = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const query = { workspace: req.workspace._id };
  const total = await Activity.countDocuments(query);
  const activity = await Activity.find(query)
    .populate('user', 'name')
    .populate('task', 'title')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ activity, total, page, totalPages: Math.ceil(total / limit) });
});

// GET /tasks/:workspaceId/:taskId/history — same collection, filtered to one task
const getTaskHistory = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const history = await Activity.find({ workspace: req.workspace._id, task: taskId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  res.json(history);
});

module.exports = { getWorkspaceActivity, getTaskHistory };
