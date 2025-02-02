const express = require("express");
const notification_route = express.Router();
const auth = require("../middlewares/auth");
const {
  getNotifications,
  markAsRead,
} = require("../controllers/notification_controller");

// Fetch notifications for the logged-in user
notification_route.get("/", auth, getNotifications);

// Mark a specific notification as read
notification_route.patch("/:notificationId/read", auth, markAsRead);

module.exports = notification_route;
