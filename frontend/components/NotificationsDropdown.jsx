"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import { FiBell } from "react-icons/fi";

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const fetchUnread = async () => {
    const { data } = await api.get("/api/notifications/unread-count");
    setUnread(data.unreadCount || 0);
  };

  const fetchList = async () => {
    const { data } = await api.get("/api/notifications?limit=20&page=1");
    setItems(data.notifications || []);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchUnread().catch(() => {});
    fetchList().catch(() => {});

    const s = getSocket();
    const onNew = (n) => {
      setItems((prev) => [n, ...prev].slice(0, 20));
      setUnread((u) => u + 1);
      try {
        if (Notification?.permission === "granted") {
          new Notification(n.title || "Notification", { body: n.message });
        }
      } catch (_) {}
    };

    s.on("notification:new", onNew);
    s.on("notification:broadcast", onNew);
    return () => {
      s.off("notification:new", onNew);
      s.off("notification:broadcast", onNew);
    };
  }, []);

  const markRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, readAt: x.readAt || new Date().toISOString() } : x)));
      setUnread((u) => Math.max(u - 1, 0));
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const requestBrowser = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") toast.success("Browser notifications enabled");
    } catch (_) {}
  };

  const hasUnread = useMemo(() => unread > 0, [unread]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center"
        title="Notifications"
      >
        <span className="text-lg text-slate-500"><FiBell /></span>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-3 w-80 card p-0 overflow-hidden z-[100] shadow-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50">
            <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Notifications
            </p>
            <button onClick={requestBrowser} className="text-[10px] font-black uppercase tracking-widest text-brandA">
              Enable browser
            </button>
          </div>
          <div className="max-h-96 overflow-auto">
            {!items.length && <div className="px-4 py-6 text-sm text-slate-500">No notifications</div>}
            {items.map((n) => (
              <button
                key={n._id}
                onClick={() => markRead(n._id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-200/30 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-900/60 ${
                  n.readAt ? "opacity-70" : ""
                }`}
              >
                <p className="text-xs font-black">{n.title || "Notification"}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-2">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

