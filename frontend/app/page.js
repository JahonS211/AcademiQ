"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import Navbar from "../components/Navbar";
import PathMorphing from "../components/PathMorphing";
import { HexagonBackground } from "../components/HexagonBackground";

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-slate-950 overflow-x-hidden relative font-sans">
      <Navbar />
      
      <HexagonBackground />

      {/* Massive Background Blobs matching DeceptiConf */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-blue-500/15 dark:bg-blue-600/15 blur-[80px] rounded-full mix-blend-multiply dark:mix-blend-lighten will-change-transform" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-purple-500/15 dark:bg-purple-600/15 blur-[80px] rounded-full mix-blend-multiply dark:mix-blend-lighten will-change-transform" />
        <div className="absolute top-[20%] left-[20%] w-[35%] h-[35%] bg-cyan-400/15 dark:bg-cyan-500/15 blur-[80px] rounded-full mix-blend-multiply dark:mix-blend-lighten will-change-transform" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 min-h-screen flex flex-col justify-between">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 flex-1 mt-12">
          
          {/* Left: Typography */}
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 flex items-center justify-center lg:justify-start gap-4 text-blue-600 dark:text-blue-400 font-mono text-[10px] uppercase tracking-[0.3em] font-black"
            >
              <span>{t("kelajakTaIimi")}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              <span>ACADEMIQ.UZ</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-blue-700 dark:text-blue-500 tracking-tighter leading-[0.85] mb-8"
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
              className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-bold leading-relaxed max-w-lg mb-12 mx-auto lg:mx-0"
            >
              {t("heroDesc")}
            </motion.p>
          </div>

          {/* Right: Floating Mobile/Widget Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex-1 w-full max-w-[420px] relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[3rem] blur-3xl opacity-20" />
            <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white dark:border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center">
              
              <div className="flex items-center justify-between w-full mb-8 opacity-60">
                <span className="font-mono text-[9px] text-blue-600 dark:text-blue-400 uppercase tracking-widest font-black">AI System Active</span>
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1 h-3 bg-blue-600 rounded-full animate-bounce" />
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center relative w-full mb-8">
                 <div className="mb-8 flex justify-center w-full">
                    <PathMorphing />
                 </div>
                 
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4">
                  {t("cardTitle")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed max-w-[240px] mx-auto uppercase tracking-wide">
                  {t("cardDesc")}
                </p>
              </div>

              <Link 
                href="/register" 
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-center transition-all shadow-2xl hover:scale-[1.02] active:scale-95"
              >
                {t("cardButton")}
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
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-[0.2em] mb-2">{t("totalUsers")}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">5,032</p>
          </div>
          <div>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-[0.2em] mb-2">{t("satisfaction")}</p>
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
