"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import Navbar from "../components/Navbar";

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative font-sans">
      <Navbar />
      
      {/* Massive Background Blobs matching DeceptiConf */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 dark:bg-blue-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 dark:bg-purple-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-cyan-400/20 dark:bg-cyan-500/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 min-h-screen flex flex-col justify-between">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 flex-1 mt-12">
          
          {/* Left: Typography */}
          <div className="flex-1 max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex items-center gap-4 text-blue-600 dark:text-blue-400 font-mono text-xs uppercase tracking-widest font-bold"
            >
              <span>{t("kelajakTaIimi")}</span>
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span>ACADEMIQ.UZ</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-6xl md:text-8xl font-black text-blue-700 dark:text-blue-500 tracking-tighter leading-[0.9] mb-8"
            >
              {t("heroTitle").split("—").map((part, i) => (
                <div key={i} className={i === 1 ? "text-slate-900 dark:text-white mt-2" : ""}>
                  {part.trim()}
                  {i === 0 && <span className="text-slate-900 dark:text-white">.</span>}
                </div>
              ))}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg mb-12"
            >
              {t("heroDesc")}
            </motion.p>
          </div>

          {/* Right: Floating Mobile/Widget Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex-1 w-full max-w-md relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[3rem] blur-2xl opacity-20" />
            <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
              
              <div className="flex items-center justify-between mb-12 opacity-80">
                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-widest font-bold">Preview</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:text-blue-400" />
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-4xl font-black text-blue-700 dark:text-blue-500 tracking-tighter leading-tight mb-4">
                  {t("bugunoqOshiring")}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8">
                  {t("featuresDesc")}
                </p>
              </div>

              <Link 
                href="/register" 
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs text-center transition-all shadow-xl shadow-blue-600/20"
              >
                {t("hozirBoshlash")}
              </Link>
            </div>
          </motion.div>

        </div>

        {/* Footer Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20 border-t border-slate-200/50 dark:border-slate-800/50 pt-10 flex flex-wrap gap-12 md:gap-24"
        >
          <div>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-[0.2em] mb-2">{t("essaysWritten")}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">14,209</p>
          </div>
          <div>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-[0.2em] mb-2">Foydalanuvchilar</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">5,032</p>
          </div>
          <div>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-[0.2em] mb-2">Qoniqish</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">98%</p>
          </div>
          <div className="flex-1 flex justify-end items-center">
            <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">
              {t("exploreTariffs")} →
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
