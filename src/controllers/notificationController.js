const Notification = require("../models/Notification");
const Announcement = require("../models/Announcement");
const { createNotification, markAsRead, unreadCount } = require("../services/notificationService");

const listNotifications = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
    const skip = (page - 1) * limit;

    const items = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ notifications: items, page, limit });
  } catch (e) {
    return next(e);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await unreadCount({ userId: req.user._id });
    return res.status(200).json({ unreadCount: count });
  } catch (e) {
    return next(e);
  }
};

const readNotification = async (req, res, next) => {
  try {
    const n = await markAsRead({ userId: req.user._id, notificationId: req.params.id });
    if (!n) return res.status(404).json({ message: "Notification not found" });
    return res.status(200).json({ notification: n });
  } catch (e) {
    return next(e);
  }
};

// Admin announcement -> creates Announcement + broadcast Notification (userId=null)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, severity = "info", startsAt = null, endsAt = null } = req.body;
    if (!title || !message) return res.status(400).json({ message: "title and message are required" });

    const ann = await Announcement.create({
      title,
      message,
      severity,
      startsAt,
      endsAt,
      createdByAdminEmail: req.admin?.email || "",
    });

    await createNotification({
      userId: null,
      type: "announcement",
      severity,
      title,
      message,
      meta: { announcementId: ann._id },
    });

    return res.status(201).json({ announcement: ann });
  } catch (e) {
    return next(e);
  }
};

module.exports = {
  listNotifications,
  getUnreadCount,
  readNotification,
  createAnnouncement,
};

