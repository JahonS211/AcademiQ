"use client";

import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useI18n } from "../../lib/i18n";
import { FiGift, FiCreditCard, FiCopy } from "react-icons/fi";

export default function DonatPage() {
  const { t } = useI18n();
  const cardNumber = "5614 6827 7403 4609";

  const copyCard = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ""));
    toast.success(t("donatSuccess"));
  };

  return (
    <div className="max-w-3xl mx-auto pt-24 pb-12 px-4 text-center min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl text-4xl mb-6 shadow-inner border border-indigo-200 dark:border-indigo-800">
          <FiGift />
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter uppercase text-slate-900 dark:text-white">{t("donat")}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto leading-relaxed font-medium">
          {t("donatDesc")}
        </p>
      </motion.div>

      <div className="max-w-md mx-auto relative group mt-8">
        <button 
          onClick={copyCard}
          className="w-full relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-8 text-left text-white shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group/card border border-white/10"
        >
          {/* Card Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/card:animate-[shine_1.5s_ease-in-out]" />
          
          <div className="flex justify-between items-center mb-10">
            <FiCreditCard className="w-8 h-8 text-white/80" />
            <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-lg backdrop-blur-md">Humo / Uzcard</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Card Number</p>
              <p className="text-2xl md:text-3xl font-black tracking-widest font-mono">{cardNumber}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all text-white border border-white/20">
              <FiCopy className="w-4 h-4" />
            </div>
          </div>
        </button>

        <p className="mt-8 text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
           <FiCreditCard className="w-4 h-4" /> Barcha tushgan mablag'lar loyiha rivojiga sarflanadi
        </p>
      </div>
    </div>
  );
}
