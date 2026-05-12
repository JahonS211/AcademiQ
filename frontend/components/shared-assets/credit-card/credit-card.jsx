"use client";

import { motion } from "framer-motion";

const variants = {
  "salmon-strip-vertical": {
    bg: "from-slate-950 via-slate-900 to-slate-950",
    glow: "from-brandA/30 to-brandB/30",
    strip: "bg-gradient-to-b from-rose-400/90 to-orange-400/90",
  },
};

export default function CreditCard({
  type = "salmon-strip-vertical",
  number = "8600 1234 5678 9012",
  holder = "Thinky Support",
  expiry = "12/28",
  onClick,
}) {
  const v = variants[type] || variants["salmon-strip-vertical"];

  return (
    <div className="relative group">
      <div className={`absolute inset-0 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-[2.5rem] bg-gradient-to-br ${v.glow}`} />
      <motion.div
        whileHover={{ scale: 1.02, rotate: -0.6 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl cursor-pointer bg-gradient-to-br ${v.bg} p-10 text-white`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-10 ${v.strip} opacity-90`} />

        <div className="flex items-start justify-between">
          <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-yellow-300/90 to-yellow-600/90 shadow-inner opacity-90" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uzcard.svg" alt="Uzcard" className="h-8 opacity-90" />
        </div>

        <div className="mt-14 space-y-2">
          <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.28em]">Card number</p>
          <p className="text-2xl md:text-3xl font-mono font-black tracking-[0.12em]">{number}</p>
        </div>

        <div className="mt-10 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.28em] mb-1">Holder</p>
            <p className="text-sm font-black uppercase tracking-widest">{holder}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.28em] mb-1">Expiry</p>
            <p className="text-sm font-black tracking-widest">{expiry}</p>
          </div>
        </div>

        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <span className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl">
            Copy ✨
          </span>
        </div>
      </motion.div>
    </div>
  );
}

