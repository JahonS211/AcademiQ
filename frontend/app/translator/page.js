"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { FiCopy, FiArrowRight, FiZap } from "react-icons/fi";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";

export default function TranslatorPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [text, setText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text) return toast.error(t("enterText"));
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post("http://localhost:5000/api/translate", 
        { text, targetLanguage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(data.translatedText);
      toast.success(t("processSuccess"));
    } catch (err) {
      toast.error(t("processFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 border-brandA/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tightest uppercase gradient-text mb-2">
              {t("translator")} AI
            </h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-60">
              Powered by Llama 3.1
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Target:</span>
             <select 
               className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl text-xs font-black tracking-widest text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 transition-all outline-none"
               value={targetLanguage}
               onChange={e => setTargetLanguage(e.target.value)}
             >
               {["O'zbek", "Ўзбек (Кирилл)", "Русский", "English", "Қазақша", "Türkçe", "Тоҷикӣ", "Кыргызча", "Türkmençe", "Español"].map(lang => (
                 <option key={lang} value={lang} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">{lang}</option>
               ))}
             </select>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 font-black text-xl border-4 border-white dark:border-slate-950">
              <FiArrowRight />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Source Text</label>
            <textarea 
              className="input h-80 py-6 px-8 rounded-[2rem] resize-none bg-slate-50 dark:bg-slate-950/50 border-none text-base font-medium leading-relaxed placeholder:opacity-30" 
              placeholder={t("enterText") + "..."} 
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Translation</label>
            <div className="input h-80 py-6 px-8 rounded-[2rem] bg-brandA/5 dark:bg-brandA/10 border-2 border-dashed border-brandA/20 overflow-auto whitespace-pre-wrap text-base font-medium leading-relaxed relative group">
              {result ? (
                <div className="relative h-full">
                  {result}
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                      toast.success(t("copied"));
                    }}
                    className="absolute bottom-4 right-4 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 text-slate-500"
                  >
                    <FiCopy />
                  </button>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic opacity-40">
                  {t("loading")}...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <button 
            onClick={handleTranslate}
            disabled={loading}
            className="btn-primary px-24 py-5 text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-brandA/30 rounded-2xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><span>{t("translator")}</span> <FiZap /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
