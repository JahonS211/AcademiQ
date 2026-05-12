"use client";

import { API_BASE_URL } from "../../lib/config";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { FiCopy, FiArrowRight, FiZap, FiTrash2 } from "react-icons/fi";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import CustomSelect from "../../components/CustomSelect";
import BackButton from "../../components/BackButton";

const languageOptions = [
  { value: "Uzbek Latin", label: "O'zbekcha" },
  { value: "Russian", label: "Ruscha" },
  { value: "English", label: "English" },
  { value: "Turkish", label: "Turkcha" },
  { value: "Kazakh", label: "Qozoqcha" },
  { value: "Tajik", label: "Tojikcha" },
  { value: "Kyrgyz", label: "Qirg'izcha" },
  { value: "Spanish", label: "Spanish" },
];

export default function TranslatorPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [text, setText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) return toast.error(t("enterText"));
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API_BASE_URL}/api/translate`,
        { text, targetLanguage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(data.translatedText);
      toast.success(t("processSuccess"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("processFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult("");
  };

  if (!ready) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      <BackButton fallback="/tools" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 border-brandA/10 bg-white dark:bg-slate-900 backdrop-blur-xl overflow-visible"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tightest uppercase gradient-text mb-2">
              {t("translator")} AI
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest">
              Bepul tarjimon
            </p>
          </div>
          
          <div className="w-64">
             <CustomSelect 
               label="Target Language"
               value={targetLanguage}
               onChange={setTargetLanguage}
               options={languageOptions}
             />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 font-black text-xl border-4 border-white dark:border-slate-950">
              <FiArrowRight />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 ml-2">Source Text</label>
            <textarea 
              className="input h-80 py-6 px-8 rounded-[2rem] resize-none bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-base font-semibold leading-relaxed placeholder:text-slate-500 dark:placeholder:text-slate-400" 
              placeholder={t("enterText") + "..."} 
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 ml-2">Translation</label>
            <div className="h-80 py-6 px-8 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-indigo-200 dark:border-indigo-900 overflow-auto whitespace-pre-wrap text-base font-semibold leading-relaxed text-slate-900 dark:text-white relative group">
              {result ? (
                <div className="relative min-h-full pr-12">
                  {result}
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                      toast.success(t("copied"));
                    }}
                    className="absolute bottom-0 right-0 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 text-slate-600 dark:text-slate-200"
                  >
                    <FiCopy />
                  </button>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-300 font-black uppercase tracking-widest text-xs text-center">
                  {loading ? "Tarjima qilinmoqda..." : "Tarjima shu yerda chiqadi"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-3">
          <button 
            onClick={handleTranslate}
            disabled={loading}
            className="btn-primary px-24 py-5 text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-brandA/30 rounded-2xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{t("translator")}</span> 
                <FiZap className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              </>
            )}
          </button>
          {(text || result) && (
            <button
              onClick={handleClear}
              className="px-10 py-5 bg-rose-500/10 text-rose-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all"
            >
              <FiTrash2 />
              Tozalash
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}