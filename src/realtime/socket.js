const jwt = require("jsonwebtoken");

let ioRef = null;

const initSocket = (httpServer) => {
  // Lazy require to avoid dependency issues if not installed
  const { Server } = require("socket.io");
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");
      if (!token) return next(new Error("unauthorized"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      return next();
    } catch (e) {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      const User = require("../models/User");
      await User.findByIdAndUpdate(socket.userId, { isOnline: true }).catch(() => {});
      io.emit("user_status", { userId: socket.userId, isOnline: true });
    }
    socket.on("disconnect", async () => {
      if (socket.userId) {
        const User = require("../models/User");
        const now = new Date();
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeenAt: now }).catch(() => {});
        io.emit("user_status", { userId: socket.userId, isOnline: false, lastSeenAt: now });
      }
    });
  });

  ioRef = io;
  return io;
};

const getIO = () => ioRef;

module.exports = { initSocket, getIO };

