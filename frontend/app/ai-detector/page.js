"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { FiEye, FiZap, FiBarChart2, FiActivity, FiTrash2 } from "react-icons/fi";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";

export default function AiDetectorPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const handleDetect = async () => {
    if (!text.trim()) return toast.error("Iltimos, matnni kiriting");
    if (text.trim().length < 50) return toast.error("Matn kamida 50 ta belgidan iborat bo'lishi kerak");
    
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post("https://academiq-production-0920.up.railway.app/api/ai-detector/detect", {
        text
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setResult(data.result);
        toast.success("Tahlil yakunlandi!");
        syncUserCredits(data.remainingCredits);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Xatolik yuz berdi";
      if (msg.toLowerCase().includes("kredit") || msg.toLowerCase().includes("credit")) {
        setShowCreditModal(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
  };

  if (!ready) return null;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-full border border-indigo-500/20 mb-2">
          <FiEye className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Authenticity Radar</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">AI Detector</h1>
        <p className="text-slate-500 font-medium text-sm max-w-lg mx-auto">
          Matnni AI tomonidan yozilganligini tekshiring va haqiqiylik darajasini aniqlang.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 card p-8 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[2.5rem] flex flex-col">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-4">Tekshirish uchun matn</label>
          <textarea 
            className="flex-1 min-h-[400px] w-full py-6 px-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/30 transition-all outline-none font-bold text-sm shadow-inner resize-none"
            placeholder="Kamida 50 ta belgidan iborat matnni kiriting..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handleDetect}
            disabled={loading}
            className="mt-6 w-full py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? "Tahlil qilinmoqda..." : (
              <>
                Tahlil Qilish <FiZap className="text-amber-400" />
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[2.5rem]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Tahlil Natijalari</h3>
              {result && (
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                >
                  <FiTrash2 />
                  Tozalash
                </button>
              )}
            </div>
            
            {!result ? (
              <div className="flex flex-col items-center justify-center text-center opacity-30 grayscale py-12">
                 <FiActivity className="text-5xl mb-4" />
                 <p className="text-sm font-bold max-w-[200px]">Matnni kiriting va tahlil tugmasini bosing</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Score Gauge */}
                <div className="relative flex items-center justify-center">
                   <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 dark:border-slate-800 flex items-center justify-center">
                      <div className="text-center">
                         <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{result.aiScore}%</div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">AI Probability</div>
                      </div>
                   </div>
                   <svg className="absolute top-0 left-0 w-48 h-48 -rotate-90">
                      <circle 
                        cx="96" cy="96" r="84" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="12" 
                        className="text-indigo-600 transition-all duration-1000"
                        strokeDasharray={527}
                        strokeDashoffset={527 - (527 * result.aiScore) / 100}
                        strokeLinecap="round"
                      />
                   </svg>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Verdict</p>
                    <div className="flex items-center gap-3">
                       <div className={`w-3 h-3 rounded-full ${result.aiScore > 50 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                       <p className="text-sm font-black uppercase tracking-tight">
                         {result.aiScore > 70 ? 'Highly likely AI-generated' : result.aiScore > 40 ? 'Potentially AI-assisted' : 'Likely written by a human'}
                       </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Key Indicators</p>
                     {result.indicators && result.indicators.map((ind, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{ind.label}</span>
                          <span className="text-xs font-black text-indigo-500">{ind.value}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-600/20">
             <div className="flex items-center gap-4 mb-4">
                <FiBarChart2 className="text-3xl" />
                <h4 className="text-lg font-black uppercase tracking-tight">Advanced Scanning</h4>
             </div>
             <p className="text-xs font-bold text-indigo-100 leading-relaxed">
               Bizning AI detektorimiz matndagi murakkablik va o'zgaruvchanlik (perplexity & burstiness) parametrlarini tahlil qiladi.
             </p>
          </div>
        </div>
      </div>
      <InsufficientCreditsModal 
        isOpen={showCreditModal} 
        onClose={() => setShowCreditModal(false)} 
      />
    </div>
  );
}
