const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

// GET /analytics/:workspaceId[?todayStart=<ISO date>]
// Counts EVERY task in the workspace using one database aggregation
// (the old Analytics page only counted the 10 tasks on the current page).
// "todayStart" lets the browser say when ITS today began, so "overdue"
// matches the user's own time zone instead of the server's.
const getAnalytics = asyncHandler(async (req, res) => {
  const parsed = new Date(req.query.todayStart);
  const todayStart = Number.isNaN(parsed.getTime()) ? new Date(new Date().toDateString()) : parsed;
// changed
  const [result] = await Task.aggregate([
    { $match: { workspace: req.workspace._id, deletedAt: null } },
    {
      $facet: {
        totals: [{
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: ['$completed', 1, 0] } },
            overdue: {
              $sum: {
                $cond: [{
                  $and: [
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', todayStart] },
                    { $eq: ['$completed', false] },
                  ],
                }, 1, 0],
              },
            },
          },
        }],
        byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
      },
    },
  ]);

  const totals = result.totals[0] || { total: 0, completed: 0, overdue: 0 };
  const priority = { High: 0, Medium: 0, Low: 0 };
  result.byPriority.forEach((p) => { priority[p._id] = p.count; });

  res.json({
    total: totals.total,
    completed: totals.completed,
    pending: totals.total - totals.completed,
    overdue: totals.overdue,
    priority,
    categories: result.byCategory.map((c) => ({ name: c._id, value: c.count })),
  });
});

module.exports = { getAnalytics };
