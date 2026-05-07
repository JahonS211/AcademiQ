"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { motion } from "framer-motion";
import { FiBell } from "react-icons/fi";

export default function NotificationsPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get("https://academiq-api-hsvi.onrender.com/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data.notifications || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div>
         <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
           Xabarlar <FiBell className="w-6 h-6 text-indigo-500" />
         </h1>
         <p className="text-sm text-slate-500 font-medium">Barcha tizim xabarlari va bildirishnomalar</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400 font-medium text-sm">Yuklanmoqda...</div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400 font-medium italic text-sm">
            Hech qanday xabar yo'q.
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, i) => (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 key={item._id || i}
                 className={`flex flex-col justify-center p-5 rounded-2xl transition-colors border ${item.isRead ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800' : 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 shadow-sm'}`}
               >
                 <div className="flex justify-between items-start mb-2">
                   <p className={`font-bold text-sm ${item.isRead ? 'text-slate-800 dark:text-slate-200' : 'text-indigo-900 dark:text-indigo-300'}`}>
                     {item.title}
                   </p>
                   {!item.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />}
                 </div>
                 <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                   {item.message}
                 </p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                   {new Date(item.createdAt).toLocaleString()}
                 </p>
               </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
