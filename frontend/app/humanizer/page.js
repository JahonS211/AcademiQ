"use client";

import { API_BASE_URL } from "../../lib/config";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { FiCopy, FiEdit3, FiGlobe, FiTrash2, FiZap } from "react-icons/fi";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { textToolCreditCost } from "../../lib/creditCosts";
import CustomSelect from "../../components/CustomSelect";
import BackButton from "../../components/BackButton";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";

const langOptions = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Ruscha" },
  { value: "en", label: "English" },
];

export default function HumanizerPage() {
  const ready = useRequireAuth();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("uz");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const creditCost = useMemo(() => textToolCreditCost(12, text, 900, 23), [text]);

  const handleHumanize = async () => {
    if (!text.trim()) return toast.error("Matn kiriting");
    if (text.trim().length < 30) return toast.error("Matn kamida 30 ta belgidan iborat bo'lsin");

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API_BASE_URL}/api/ai-detector/humanize`, { text, language }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setResult(data.result);
        toast.success("Matn tabiiylashtirildi");
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

  const clearAll = () => {
    setText("");
    setResult(null);
  };

  const copyResult = async () => {
    if (!result?.humanizedText) return;
    await navigator.clipboard.writeText(result.humanizedText);
    toast.success("Nusxa olindi");
  };

  if (!ready) return null;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-7">
      <BackButton fallback="/tools" />

      <header className="card p-6 md:p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-visible">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-600 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              <FiEdit3 />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none">Humanizer</h1>
              <p className="mt-3 text-slate-500 font-medium text-sm max-w-2xl">
                AI uslubidagi matnni tabiiyroq, ravonroq va odam yozgandek qilib qayta yozadi.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-56">
            <CustomSelect value={language} onChange={setLanguage} options={langOptions} label="Javob tili" />
          </div>
        </div>
      </header>

      <section className="grid lg:grid-cols-2 gap-7">
        <div className="card p-6 md:p-8 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem] flex flex-col gap-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asl matn</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tabiiyroq qilish kerak bo'lgan matnni kiriting..."
            className="w-full min-h-[340px] p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-fuchsia-500/30 outline-none resize-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="card p-6 md:p-8 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem] flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tabiiylashtirilgan matn</label>
            {result?.humanizedText && (
              <button onClick={copyResult} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">
                <FiCopy /> Nusxa
              </button>
            )}
          </div>
          <div className="min-h-[340px] p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
            {result?.humanizedText || <span className="text-slate-400">Natija shu yerda chiqadi</span>}
          </div>
          {result?.changesSummary && (
            <p className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4">{result.changesSummary}</p>
          )}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <button onClick={handleHumanize} disabled={loading} className="min-h-[58px] rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl transition-all hover:scale-[1.01] active:scale-95">
          {loading ? "Yozilmoqda..." : <><span>Humanize</span><FiZap className="text-amber-400" /><span className="px-2.5 py-1 bg-fuchsia-600 text-white rounded-lg text-[9px]">{creditCost} kredit</span></>}
        </button>
        {(text || result) && (
          <button onClick={clearAll} className="min-h-[58px] px-6 rounded-2xl bg-rose-500/10 text-rose-500 font-black uppercase tracking-widest text-[10px] inline-flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all">
            <FiTrash2 /> Tozalash
          </button>
        )}
      </div>

      <InsufficientCreditsModal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} />
    </div>
  );
}
