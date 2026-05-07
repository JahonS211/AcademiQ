const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  listNotifications,
  getUnreadCount,
  readNotification,
  createAnnouncement,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/notifications", authMiddleware, listNotifications);
router.get("/notifications/unread-count", authMiddleware, getUnreadCount);
router.post("/notifications/:id/read", authMiddleware, readNotification);

router.post("/admin/announcements", adminMiddleware, createAnnouncement);

module.exports = router;

