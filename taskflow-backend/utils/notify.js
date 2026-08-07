const Notification = require('../models/Notification');

const notify = async ({ workspace, user, fromUser, task = null, type, message }) => {
  // Don't notify someone about their own action (e.g. assigning a task to yourself)
  if (String(user) === String(fromUser)) return;
  try {
    await Notification.create({ workspace, user, fromUser, task, type, message });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

module.exports = notify;
