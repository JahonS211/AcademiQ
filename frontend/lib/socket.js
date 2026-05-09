import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "https://academiq-production-0920.up.railway.app/";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  socket = io(base, {
    transports: ["websocket"],
    auth: { token },
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

