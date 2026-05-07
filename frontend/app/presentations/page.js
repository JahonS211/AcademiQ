"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { FiPieChart, FiZap } from "react-icons/fi";

export default function PresentationsPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [presentations, setPresentations] = useState([]);

  const fetchPresentations = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/presentations");
      setPresentations(data.presentations || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (ready) fetchPresentations();
  }, [ready]);

  const handleGenerate = async () => {
    if (!topic) return toast.error("Mavzuni kiriting!");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post("http://localhost:5000/api/presentations/generate", 
        { topic, language: "uz" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Prezentatsiya tayyor!");
      setTopic("");
      fetchPresentations();
      // Auto-download
      window.open(`http://localhost:5000${data.presentation.fileUrl}`, "_blank");
    } catch (err) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brandA/5 rounded-full -mr-8 -mt-8 blur-2xl" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl">
            <FiPieChart />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">{t("presentationsTitle")}</h1>
            <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.2em]">AI Slide Creation</p>
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-8 font-medium max-w-xl">
          {t("presentationsDesc")}
        </p>
        
        <div className="flex flex-col md:flex-row gap-3">
          <input 
            className="input flex-1 py-4 px-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 ring-brandA/20 font-bold text-sm" 
            placeholder={t("topicPlaceholder")} 
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
          <button 
            disabled={loading}
            onClick={handleGenerate}
            className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? t("loading") : <span className="flex items-center justify-center gap-2">{t("generate")} <FiZap /></span>}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black tracking-tighter uppercase ml-1">{t("myPresentations")}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presentations.map((item) => (
            <div key={item._id} className="card p-6 flex flex-col hover:shadow-xl transition-all border-none bg-white dark:bg-slate-900">
              <div className="mb-4 text-3xl text-indigo-600 dark:text-indigo-400"><FiPieChart /></div>
              <h3 className="font-bold text-sm mb-2 line-clamp-2 uppercase tracking-tight">{item.title}</h3>
              <p className="text-[10px] text-slate-400 uppercase font-black mb-6 tracking-widest">{item.category}</p>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-bold">{new Date(item.createdAt).toLocaleDateString()}</span>
                <a 
                  href={`http://localhost:5000${item.fileUrl}`} 
                  target="_blank" 
                  className="text-brandA font-black text-[10px] uppercase tracking-widest hover:underline"
                >
                  {t("download")} ↓
                </a>
              </div>
            </div>
          ))}
          {presentations.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem]">
              Hozircha prezentatsiyalar yo'q.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
