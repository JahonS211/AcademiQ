const Notification = require("../models/Notification");
const { getIO } = require("../realtime/socket");

const createNotification = async ({
  userId = null,
  type = "system",
  severity = "info",
  title = "",
  message,
  meta = {},
}) => {
  if (!message) throw new Error("Notification message is required");
  const created = await Notification.create({ userId, type, severity, title, message, meta });

  const io = getIO();
  if (io) {
    if (created.userId) {
      io.to(`user:${created.userId.toString()}`).emit("notification:new", created);
    } else {
      io.emit("notification:broadcast", created);
    }
  }

  return created;
};

const markAsRead = async ({ userId, notificationId }) => {
  const n = await Notification.findOne({ _id: notificationId, userId });
  if (!n) return null;
  if (!n.readAt) {
    n.readAt = new Date();
    await n.save();
  }
  return n;
};

const unreadCount = async ({ userId }) =>
  Notification.countDocuments({ userId, readAt: null });

module.exports = {
  createNotification,
  markAsRead,
  unreadCount,
};

