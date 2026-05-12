"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

export default function BackButton({ fallback = "/tools", label = "Orqaga" }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brandA/50 hover:text-brandA transition-all text-[10px] font-black uppercase tracking-widest"
    >
      <FiArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}