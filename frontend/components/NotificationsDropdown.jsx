"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import { FiBell, FiTrash2, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [isBottom, setIsBottom] = useState(false);
  const triggerRef = useRef(null);

  const fetchUnread = async () => {
    try {
      const { data } = await api.get("/api/notifications/unread-count");
      setUnread(data.unreadCount || 0);
    } catch(e){}
  };

  const fetchList = async () => {
    try {
      const { data } = await api.get("/api/notifications?limit=20&page=1");
      setItems(data.notifications || []);
    } catch(e){}
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
    };

    s.on("notification:new", onNew);
    s.on("notification:broadcast", onNew);
    return () => {
      s.off("notification:new", onNew);
      s.off("notification:broadcast", onNew);
    };
  }, []);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setIsBottom(rect.top > window.innerHeight / 2);
    }
  }, [open]);

  const markRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, readAt: x.readAt || new Date().toISOString() } : x)));
      setUnread((u) => Math.max(u - 1, 0));
    } catch (e) {}
  };

  const deleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      setItems((prev) => prev.filter(x => x._id !== id));
      fetchUnread();
    } catch (e) {
      toast.error("O'chirishda xatolik");
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Barcha bildirishnomalarni o'chirmoqchimisiz?")) return;
    try {
      await api.delete("/api/notifications/clear");
      setItems([]);
      setUnread(0);
      toast.success("Barchasi tozalandi");
    } catch (e) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setItems((prev) => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
      setUnread(0);
      toast.success("Hammasi o'qildi");
    } catch (e) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const requestBrowser = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") toast.success("Brauzer bildirishnomalari yoqildi");
    } catch (_) {}
  };

  const hasUnread = useMemo(() => unread > 0, [unread]);

  return (
    <div className="relative" ref={triggerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center group transition-all hover:border-brandA/30"
        title="Notifications"
      >
        <span className="text-lg text-slate-500 group-hover:text-brandA transition-colors"><FiBell /></span>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black grid place-items-center shadow-lg shadow-rose-500/20">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: isBottom ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isBottom ? -10 : 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 ${isBottom ? "bottom-full mb-4" : "top-full mt-4"} w-[min(380px,calc(100vw-2rem))] rounded-[24px] overflow-hidden z-[9999] shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Bildirishnomalar
                </p>
                {items.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[9px] font-black text-slate-600 dark:text-slate-400">
                    {items.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {items.length > 0 && (
                  <>
                    <button 
                      onClick={markAllAsRead}
                      className="px-2 py-1 bg-brandA/10 text-brandA hover:bg-brandA/20 rounded-md text-[8px] font-black uppercase tracking-widest transition-all"
                    >
                      Hammasini o'qish
                    </button>
                    <button 
                      onClick={clearAll}
                      className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-md text-[8px] font-black uppercase tracking-widest transition-all"
                    >
                      Tozalash
                    </button>
                  </>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[min(500px,calc(100vh-8rem))] overflow-y-auto no-scrollbar flex flex-col">
              {!items.length ? (
                <div className="px-10 py-16 text-center">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <FiBell className="w-8 h-8" />
                   </div>
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Bildirishnomalar yo'q</p>
                </div>
              ) : (
                items.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => markRead(n._id)}
                    className={`w-full group text-left px-5 py-4 flex flex-col gap-1 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer relative ${
                      n.readAt ? "opacity-60" : "bg-brandA/[0.03]"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <p className={`text-[13px] leading-tight ${!n.readAt ? "font-black text-slate-900 dark:text-white" : "font-bold text-slate-600 dark:text-slate-400"}`}>
                        {n.title || "Notification"}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {!n.readAt && <span className="w-1.5 h-1.5 rounded-full bg-brandA shadow-[0_0_8px_rgba(var(--brandA-rgb),0.5)] mt-1.5" />}
                        <button 
                          onClick={(e) => deleteOne(e, n._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pr-8">{n.message}</p>
                    <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-widest opacity-60">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            {items.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                 <button onClick={requestBrowser} className="w-full py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-brandA hover:border-brandA/30 transition-all">
                    Brauzer bildirishnomalarini yoqish
                 </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
