const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  listNotifications,
  getUnreadCount,
  readNotification,
  createAnnouncement,
  deleteNotification,
  clearNotifications,
  markAllAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/notifications", authMiddleware, listNotifications);
router.get("/notifications/unread-count", authMiddleware, getUnreadCount);
router.post("/notifications/read-all", authMiddleware, markAllAsRead);
router.post("/notifications/:id/read", authMiddleware, readNotification);
router.delete("/notifications/clear", authMiddleware, clearNotifications);
router.delete("/notifications/:id", authMiddleware, deleteNotification);

router.post("/admin/announcements", adminMiddleware, createAnnouncement);

module.exports = router;

