"use client";

import { motion } from "framer-motion";

export function HexagonBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-80 dark:opacity-30 z-0">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='100' viewBox='0 0 60 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-opacity='0.08' fill='%236366f1' stroke='%236366f1' stroke-width='1.5' stroke-opacity='0.2'/%3E%3Cpath d='M30 100l25.98-15v-30L30 40l-25.98 15v30z' fill-opacity='0.08' fill='%238b5cf6' stroke='%238b5cf6' stroke-width='1.5' stroke-opacity='0.2'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 100px",
        }}
      />
      <motion.div
        className="absolute w-full h-full bg-gradient-to-t from-[#FDFCF8] via-transparent to-transparent dark:from-slate-950"
      />
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/20 blur-[120px] rounded-full will-change-transform"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/20 blur-[120px] rounded-full will-change-transform"
      />
    </div>
  );
}
