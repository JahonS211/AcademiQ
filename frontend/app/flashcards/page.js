"use client";

import { API_BASE_URL } from "../../lib/config";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { flashcardsCreditCost } from "../../lib/creditCosts";
import { FiZap, FiLayers, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import CustomSelect from "../../components/CustomSelect";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";
import BackButton from "../../components/BackButton";

export default function FlashcardsPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [topic, setTopic] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [language, setLanguage] = useState("uz");
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState({});
  const [showCreditModal, setShowCreditModal] = useState(false);

  const langOptions = [
    { value: "uz", label: "O'zbekcha" },
    { value: "ru", label: "Ruscha" },
    { value: "en", label: "English" },
  ];

  const creditCost = flashcardsCreditCost(count);

  const countOptions = [
    { value: 4, label: "4 karta" },
    { value: 6, label: "6 karta" },
    { value: 8, label: "8 karta" },
    { value: 10, label: "10 karta" },
    { value: 12, label: "12 karta" },
  ];

  const handleClear = () => {
    setTopic("");
    setFlashcards([]);
    setFlipped({});
    setCount(6);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error(t("enterTopic"));
    setLoading(true);
    setFlashcards([]);
    setFlipped({});
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API_BASE_URL}/api/flashcards`, {
        topic, count, language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcards(data.flashcards || []);
      syncUserCredits(data.remainingCredits);
      toast.success(t("generatedSuccess"));
    } catch (err) {
      const msg = err.response?.data?.message || "Xatolik yuz berdi";
      if (msg.toLowerCase().includes("kredit") || msg.toLowerCase().includes("credit")) {
        setShowCreditModal(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFlip = (idx) => {
    setFlipped(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!ready) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4">
      <BackButton fallback="/tools" />
      <div className="card p-6 md:p-8 bg-white dark:bg-slate-900 border-none shadow-xl relative overflow-visible">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8 blur-2xl" />
        
        <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              <FiLayers />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-tight">{t("activeRecall")}</h1>
              <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.2em]">{t("studyTool")}</p>
            </div>
          </div>

          <div className="grid gap-3 w-full">
            <input 
              className="input w-full min-h-[54px] py-4 px-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 ring-indigo-500/20 font-bold text-sm" 
              placeholder={t("enterTopicPhotosynthesis")} 
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[160px_150px_1fr] items-stretch">
              <CustomSelect value={language} onChange={setLanguage} options={langOptions} />
              <CustomSelect value={count} onChange={setCount} options={countOptions} />
              <button 
                onClick={handleGenerate} 
                disabled={loading}
                className="min-h-[54px] px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group whitespace-nowrap sm:col-span-2 lg:col-span-1"
              >
                {loading ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <>
                    <span>YARATISH</span>
                    <FiZap className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg text-[9px] font-black tracking-tighter">{creditCost} {t("credits").toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {flashcards.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-5 py-3 bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
          >
            <FiTrash2 />
            Tozalash
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {flashcards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="perspective-1000 h-64 cursor-pointer group"
              onClick={() => toggleFlip(idx)}
            >
              <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${flipped[idx] ? "rotate-y-180" : ""}`}>
                {/* Front */}
                <div className="absolute inset-0 backface-hidden card p-8 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 border-none shadow-lg">
                   <span className="absolute top-4 left-4 text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">{t("question")}</span>
                   <p className="text-base font-black text-slate-800 dark:text-slate-200 leading-tight">{card.front}</p>
                   <div className="mt-8 text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                     {t("clickToSee")} <FiRefreshCw />
                   </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 card p-8 flex flex-col items-center justify-center text-center bg-indigo-600 text-white border-none shadow-2xl">
                   <span className="absolute top-4 left-4 text-[10px] font-black text-white/40 uppercase tracking-widest">{t("answer")}</span>
                   <p className="text-sm font-medium leading-relaxed">{card.back}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {flashcards.length === 0 && !loading && (
        <div className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
           {t("createFlashcards")}
        </div>
      )}
      <InsufficientCreditsModal 
        isOpen={showCreditModal} 
        onClose={() => setShowCreditModal(false)} 
      />
    </div>
  );
}
