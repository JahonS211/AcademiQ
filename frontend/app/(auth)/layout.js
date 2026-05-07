"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="h-screen flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 dark:border-slate-800 h-full max-h-[640px]"
      >
        
        {/* Left Side: Form Content */}
        <div className="w-full md:w-[48%] p-6 md:p-8 flex flex-col justify-center relative bg-white dark:bg-slate-950 min-h-[400px] overflow-hidden">
          <AnimatePresence mode="wait">
             <motion.div
               key={pathname}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 10 }}
               transition={{ duration: 0.2 }}
               className="w-full max-w-xs mx-auto"
             >
               {children}
             </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Visual Section */}
        <div className="hidden md:flex flex-1 relative bg-slate-900 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brandA to-brandB opacity-90" />
          
          <div className="relative z-10 p-10 flex flex-col justify-between h-full w-full text-white">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center text-2xl border border-white/20">
                🚀
              </div>
              <h2 className="text-3xl font-black tracking-tightest leading-tight">
                Kelajakni biz bilan <br /> <span className="text-white/60">yarating.</span>
              </h2>
              <p className="text-base text-white/70 max-w-xs font-medium leading-relaxed">
                AcademiQ platformasi orqali o'qish jarayoningizni butunlay yangi darajaga olib chiqing.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-[2rem] shadow-2xl">
               <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                     {[1,2,3].map(i => (
                        <div key={i} className={`w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center font-bold text-[10px]`}>
                           {String.fromCharCode(64 + i)}
                        </div>
                     ))}
                  </div>
                  <div>
                    <p className="font-black text-sm">10,000+ Talabalar</p>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Sizni kutmoqda</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
