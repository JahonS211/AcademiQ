"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { essayApi } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { FiEdit3, FiTrash2, FiZap } from "react-icons/fi";
import { syncUserCredits } from "../../lib/syncUtils";
import CustomSelect from "../../components/CustomSelect";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";

export default function EssayGeneratorPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [form, setForm] = useState({ topic: "", language: "uz", length: "medium" });
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const generateEssay = async () => {
    if (!form.topic.trim()) return toast.error(t("topicRequired"));
    setLoading(true);
    try {
      const { data } = await essayApi.generate(form);
      setEssay(data.essay.content);
      syncUserCredits(data.remainingCredits);
      toast.success(t("generated"));
    } catch (error) {
      const msg = error.response?.data?.message || t("generateFailed");
      if (msg.toLowerCase().includes("kredit") || msg.toLowerCase().includes("credit")) {
        setShowCreditModal(true);
      } else {
        const retryDelay = error.response?.data?.retryDelay;
        toast.error(retryDelay ? `${msg} (retry in ${retryDelay})` : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyEssay = async () => {
    if (!essay) return;
    const text = `${essay.introduction}\n\n${essay.body}\n\n${essay.conclusion}`;
    await navigator.clipboard.writeText(text);
    toast.success(t("copied"));
  };

  const downloadDocx = () => {
    if (!essay) return;
    const content = `${essay.introduction}\n\n${essay.body}\n\n${essay.conclusion}`;
    const blob = new Blob([content], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "essay.docx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearEssay = () => {
    setEssay(null);
    setForm({ topic: "", language: "uz", length: "medium" });
    toast.success("Tozalandi");
  };

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2 md:py-6 px-2 md:px-0">
      <div className="card p-6 md:p-10 bg-white dark:bg-slate-900 border-none shadow-2xl relative overflow-visible z-20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brandA/5 rounded-full -mr-10 -mt-10 blur-3xl" />
        
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-indigo-500/5">
            <FiEdit3 />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">{t("essay")}</h1>
            <p className="text-slate-500 font-bold uppercase text-[8px] md:text-[9px] tracking-[0.2em] mt-1">AI Academic Writing</p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("topicPlaceholder")}</label>
            <textarea 
              className="input py-5 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-4 ring-brandA/10 text-sm font-bold min-h-[100px] resize-none" 
              placeholder={t("topicPlaceholder")} 
              value={form.topic} 
              onChange={(e) => setForm({ ...form, topic: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomSelect 
              label={t("language")}
              value={form.language}
              onChange={(val) => setForm({ ...form, language: val })}
              options={[
                { value: "uz", label: "O'zbekcha 🇺🇿" },
                { value: "ru", label: "Русский 🇷🇺" },
                { value: "en", label: "English 🇺🇸" }
              ]}
            />
            <CustomSelect 
              label={t("length")}
              value={form.length}
              onChange={(val) => setForm({ ...form, length: val })}
              options={[
                { value: "short", label: t("short") },
                { value: "medium", label: t("medium") },
                { value: "long", label: t("long") }
              ]}
            />
          </div>

          <button 
            onClick={generateEssay} 
            disabled={loading}
            className="w-full py-5 md:py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 group"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="animate-pulse">{t("loading")}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                   <span>{t("generate")}</span>
                   <FiZap className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                </div>
                <span className="px-2.5 py-1 bg-brandA text-white rounded-lg text-[9px] font-black tracking-tighter uppercase shadow-lg shadow-brandA/20">10 {t("credits")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {essay && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl relative z-0"
        >
          <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
            <h2 className="text-xl font-black tracking-tighter uppercase">{t("result")}</h2>
            <div className="flex gap-2">
              <button 
                className="px-6 py-2.5 bg-brandA/10 text-brandA rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-brandA hover:text-white transition-all" 
                onClick={copyEssay}
              >
                {t("copy")}
              </button>
              <button 
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all" 
                onClick={downloadDocx}
              >
                {t("downloadDocx")}
              </button>
              <button
                className="px-6 py-2.5 bg-rose-500/10 text-rose-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2"
                onClick={clearEssay}
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                Tozalash
              </button>
            </div>
          </div>

          <article className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300">
            <section className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">I</span>
                {t("introduction")}
              </h3>
              <p className="text-sm leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-2xl">
                {essay.introduction}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">II</span>
                {t("body")}
              </h3>
              <div className="text-sm leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-2xl whitespace-pre-line">
                {essay.body}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">III</span>
                {t("conclusion")}
              </h3>
              <p className="text-sm leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-2xl">
                {essay.conclusion}
              </p>
            </section>
          </article>
        </motion.div>
      )}

      <InsufficientCreditsModal 
        isOpen={showCreditModal} 
        onClose={() => setShowCreditModal(false)} 
      />
    </div>
  );
}
