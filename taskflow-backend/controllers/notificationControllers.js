const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// GET /notifications — most recent first, plus an unread count for the badge
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .populate('fromUser', 'name')
    .populate('task', 'title')
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });

  res.json({ notifications, unreadCount });
});

// PATCH /notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { read: true },
    { new: true }
  );
  if (!notification) throw new AppError('Notification not found', 404);
  res.json(notification);
});

// PATCH /notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
});

// DELETE /notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!notification) throw new AppError('Notification not found', 404);
  res.json({ message: 'Notification deleted' });
});

// DELETE /notifications — clears everything for the logged-in user, so the
// collection doesn't grow unbounded per-user with stuff they no longer care about
const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user.id });
  res.json({ message: 'All notifications cleared' });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications };