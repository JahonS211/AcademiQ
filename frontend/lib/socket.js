import { API_BASE_URL } from "./config";
import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const base = `${API_BASE_URL}`;
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

