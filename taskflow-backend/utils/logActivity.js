const Activity = require('../models/Activity');

// Fire-and-forget-ish logger — awaited, but a logging failure shouldn't be
// allowed to break the actual task/comment operation that triggered it.
const logActivity = async ({ workspace, task = null, user, type, message, field = null, from = null, to = null }) => {
  try {
    await Activity.create({ workspace, task, user, type, message, field, from, to });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

module.exports = logActivity;
