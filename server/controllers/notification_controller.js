const Notification = require("../models/notification_model");


exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .sort({ createdAt: -1 })
      .populate("sender", "name") // Show sender details
      .lean();

    res.status(200).json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.markAsRead = async (req, res) => {
    try {
      const { notificationId } = req.params;
  
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
  
      res.status(200).json({ message: "Notification marked as read" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };