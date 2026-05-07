"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { essayApi } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { FiEdit3, FiZap } from "react-icons/fi";

export default function EssayGeneratorPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [form, setForm] = useState({ topic: "", language: "uz", length: "medium" });
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateEssay = async () => {
    if (!form.topic.trim()) return toast.error(t("topicRequired"));
    setLoading(true);
    try {
      const { data } = await essayApi.generate(form);
      setEssay(data.essay.content);
      toast.success(t("generated"));
    } catch (error) {
      const retryDelay = error.response?.data?.retryDelay;
      const msg = error.response?.data?.message || t("generateFailed");
      toast.error(retryDelay ? `${msg} (retry in ${retryDelay})` : msg);
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

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brandA/5 rounded-full -mr-8 -mt-8 blur-2xl" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl">
            <FiEdit3 />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">{t("essay")}</h1>
            <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.2em]">AI Academic Writing</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("topicPlaceholder")}</label>
            <input 
              className="input py-4 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 ring-brandA/10 text-sm font-bold" 
              placeholder={t("topicPlaceholder")} 
              value={form.topic} 
              onChange={(e) => setForm({ ...form, topic: e.target.value })} 
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("language")}</label>
              <div className="relative group">
                <select 
                  className="input py-3.5 px-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none appearance-none font-bold text-xs cursor-pointer focus:ring-2 ring-brandA/20" 
                  value={form.language} 
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                >
                  <option value="uz">O'zbekcha 🇺🇿</option>
                  <option value="ru">Русский 🇷🇺</option>
                  <option value="en">English 🇺🇸</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity text-[10px]">▼</div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("length")}</label>
              <div className="relative group">
                <select 
                  className="input py-3.5 px-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none appearance-none font-bold text-xs cursor-pointer focus:ring-2 ring-brandA/20" 
                  value={form.length} 
                  onChange={(e) => setForm({ ...form, length: e.target.value })}
                >
                  <option value="short">{t("short")}</option>
                  <option value="medium">{t("medium")}</option>
                  <option value="long">{t("long")}</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity text-[10px]">▼</div>
              </div>
            </div>
          </div>

          <button 
            onClick={generateEssay} 
            disabled={loading}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t("loading")}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">{t("generate")} <FiZap /></span>
            )}
          </button>
        </div>
      </div>

      {essay && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl"
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
    </div>
  );
}
