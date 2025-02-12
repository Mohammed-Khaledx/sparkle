const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  getUnreadCount,
  markAllAsRead 
} = require('../controllers/notification_controller');
const auth = require('../middlewares/auth');

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount); // Match the frontend URL
router.patch('/:notificationId/read', auth, markAsRead);
router.post('/mark-all-read', auth, markAllAsRead);

module.exports = router;
