const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const { getMyNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = require('../controllers/notificationControllers');

router.use(verifyJWT);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/', clearAllNotifications);
router.delete('/:id', deleteNotification);

module.exports = router;