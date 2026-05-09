"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [activeTab, setActiveTab] = useState("payment");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        let endpoint = "";
        if (activeTab === "payment") endpoint = "https://academiq-production-0920.up.railway.app/api/payment/history";
        else if (activeTab === "reward") endpoint = "https://academiq-production-0920.up.railway.app/api/rewards/me";
        else if (activeTab === "credits") endpoint = "https://academiq-production-0920.up.railway.app/api/payment/credits/history";

        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data.history || res.data.ledger || res.data.payments || res.data.rewards || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Tarix</h1>
           <p className="text-sm text-slate-500 font-medium">To'lovlar va Mukofotlar tarixi</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab("payment")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payment' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Payment
          </button>
          <button 
            onClick={() => setActiveTab("reward")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reward' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Reward
          </button>
          <button 
            onClick={() => setActiveTab("credits")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'credits' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Credits
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400 font-medium text-sm">Yuklanmoqda...</div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400 font-medium italic text-sm">
            Bu bo'limda ma'lumot yo'q.
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={item._id || i}
                  className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors border border-slate-100 dark:border-slate-700/50"
                >
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                      {item.actionType || item.status || item.type || "Completed"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      {item.description || new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className={`font-bold text-base ${activeTab === 'credits' ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {activeTab === 'credits' ? `-${item.amount}` : (item.amount || item.points ? `+${item.amount || item.points}` : "—")}
                  </div>
                </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
