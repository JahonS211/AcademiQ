"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { FiCheckCircle, FiEdit, FiZap, FiGlobe, FiTrash2 } from "react-icons/fi";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";
import CustomSelect from "../../components/CustomSelect";

export default function GrammarlyPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState("uz");
  const [showCreditModal, setShowCreditModal] = useState(false);

  const langOptions = [
    { value: "uz", label: "O'zbekcha" },
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" },
  ];

  const handleCheck = async () => {
    if (!text.trim()) return toast.error("Iltimos, matnni kiriting");
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post("https://academiq-production-0920.up.railway.app/api/grammarly/check", {
        text,
        language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setResult(data.result);
        toast.success("Matn muvaffaqiyatli tekshirildi!");
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20 mb-2">
          <FiCheckCircle className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Grammar Master</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Grammarly AI</h1>
        <p className="text-slate-500 font-medium text-sm max-w-lg mx-auto">
          Matningizdagi xatolarni toping va mukammal holatga keltiring.
        </p>
        <div className="flex justify-center mt-6">
           <div className="w-40">
             <CustomSelect 
               options={langOptions}
               value={language}
               onChange={setLanguage}
               icon={<FiGlobe />}
             />
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[2.5rem] flex flex-col">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-4">Sizning Matningiz</label>
          <textarea 
            className="flex-1 min-h-[300px] w-full py-6 px-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500/30 transition-all outline-none font-bold text-sm shadow-inner resize-none"
            placeholder="Tekshirish uchun matnni shu yerga yozing yoki tashlang..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handleCheck}
            disabled={loading}
            className="mt-6 w-full py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? "Tekshirilmoqda..." : (
              <>
                Xatolarni Tekshirish <FiZap className="text-amber-400" />
              </>
            )}
          </button>
        </div>

        <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[2.5rem]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Natija va Tavsiyalar</h3>
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
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center opacity-30 grayscale">
               <FiEdit className="text-5xl mb-4" />
               <p className="text-sm font-bold max-w-[200px]">Matnni kiriting va tekshirish tugmasini bosing</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Tog'irlangan Matn</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{result.correctedText}</p>
                <button 
                   className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                   onClick={() => {
                     navigator.clipboard.writeText(result.correctedText);
                     toast.success("Nusxa olindi!");
                   }}
                >
                  Nusxa Olish
                </button>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Xatolar Ro'yxati</p>
                 {result.errors && result.errors.map((err, i) => (
                   <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-6 h-6 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5">!</div>
                      <div>
                        <p className="text-xs font-black text-rose-500 line-through opacity-50">{err.original}</p>
                        <p className="text-xs font-black text-emerald-500 mt-0.5">→ {err.correction}</p>
                        <p className="text-[9px] font-bold text-slate-500 mt-1">{err.explanation}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <InsufficientCreditsModal 
        isOpen={showCreditModal} 
        onClose={() => setShowCreditModal(false)} 
      />
    </div>
  );
}
