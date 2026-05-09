"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiZap, FiX, FiAlertCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function InsufficientCreditsModal({ isOpen, onClose }) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          <div className="relative p-8 md:p-10 text-center">
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[2rem] flex items-center justify-center text-4xl animate-pulse">
                  <FiZap />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1.5 rounded-full">
                  <FiAlertCircle className="w-6 h-6 text-rose-500" />
                </div>
              </div>
            </div>

            {/* Text */}
            <h2 className="text-2xl font-black uppercase tracking-tightest mb-3 leading-tight">
              Kreditlar yetarli emas! ⚠️
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 px-4 leading-relaxed">
              Ushbu amaldan foydalanish uchun hisobingizda yetarli kredit mavjud emas. Balansni to'ldirishni xohlaysizmi?
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Yo'q, keyinroq
              </button>
              <button
                onClick={() => {
                  onClose();
                  router.push("/buy-credits");
                }}
                className="flex-1 py-4 rounded-2xl bg-brandA text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brandA/25 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Ha, to'ldirish ✅
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-brandA animate-ping" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium tariflarda kreditlar ko'proq!</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
