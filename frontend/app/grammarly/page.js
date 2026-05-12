"use client";

import { API_BASE_URL } from "../../lib/config";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { textToolCreditCost } from "../../lib/creditCosts";
import { FiArrowRight, FiCheckCircle, FiCopy, FiEdit, FiGlobe, FiTrash2, FiZap } from "react-icons/fi";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";
import BackButton from "../../components/BackButton";
import CustomSelect from "../../components/CustomSelect";

const langOptions = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Ruscha" },
  { value: "en", label: "English" },
];

export default function GrammarlyPage() {
  const ready = useRequireAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState("uz");
  const [showCreditModal, setShowCreditModal] = useState(false);

  const creditCost = useMemo(() => textToolCreditCost(6, text, 1100, 14), [text]);
  const errors = Array.isArray(result?.errors) ? result.errors : [];

  const handleCheck = async () => {
    if (!text.trim()) return toast.error("Iltimos, matnni kiriting");

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API_BASE_URL}/api/grammarly/check`, {
        text,
        language,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setResult(data.result);
        toast.success("Matn tekshirildi");
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

  const copyCorrected = async () => {
    if (!result?.correctedText) return;
    await navigator.clipboard.writeText(result.correctedText);
    toast.success("Nusxa olindi");
  };

  if (!ready) return null;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-7">
      <BackButton fallback="/tools" />

      <header className="card p-6 md:p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-visible">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20">
              <FiCheckCircle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Grammar Master</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none">Grammarly AI</h1>
              <p className="mt-3 text-slate-500 font-medium text-sm max-w-2xl">
                Matndagi imlo, grammatika va uslub xatolarini topadi, tanlangan tilda aniq izoh beradi.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-56">
            <CustomSelect options={langOptions} value={language} onChange={setLanguage} label="Javob tili" />
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-7">
        <section className="card p-6 md:p-8 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem] flex flex-col gap-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sizning matningiz</label>
          <textarea
            className="flex-1 min-h-[330px] w-full py-5 px-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500/30 transition-all outline-none font-bold text-sm shadow-inner resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
            placeholder="Tekshirish uchun matnni shu yerga yozing..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              onClick={handleCheck}
              disabled={loading}
              className="min-h-[56px] rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-black uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? "Tekshirilmoqda..." : (
                <>
                  Xatolarni tekshirish <FiZap className="text-amber-400" />
                  <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[9px] tracking-tight">{creditCost} kredit</span>
                </>
              )}
            </button>
            {(text || result) && (
              <button
                onClick={handleClear}
                className="min-h-[56px] px-5 rounded-2xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all inline-flex items-center justify-center gap-2"
              >
                <FiTrash2 /> Tozalash
              </button>
            )}
          </div>
        </section>

        <section className="card p-6 md:p-8 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Natija va tavsiyalar</h3>
            {result?.correctedText && (
              <button
                onClick={copyCorrected}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
              >
                <FiCopy /> Nusxa olish
              </button>
            )}
          </div>

          {!result ? (
            <div className="h-full min-h-[330px] flex flex-col items-center justify-center text-center opacity-35">
              <FiEdit className="text-5xl mb-4" />
              <p className="text-sm font-bold max-w-[220px]">Matnni kiriting va tekshirish tugmasini bosing</p>
            </div>
          ) : (
            <div className="space-y-6">
              {typeof result.score === "number" && (
                <div className="rounded-3xl border border-blue-500/15 bg-blue-500/10 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Sifat bahosi</p>
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black text-white">{result.score}/100</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/70 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-blue-600 transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, result.score))}%` }} />
                  </div>
                </div>
              )}

              <div className="p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">To'g'irlangan matn</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">{result.correctedText}</p>
                {result.summary && <p className="mt-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{result.summary}</p>}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Xatolar ro'yxati</p>
                {errors.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-500">Jiddiy xato topilmadi.</div>
                ) : errors.map((err, index) => (
                  <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5">!</div>
                    <div className="min-w-0 space-y-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {err.category && (
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                            {err.category}
                          </span>
                        )}
                        {err.severity && (
                          <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-rose-500">
                            {err.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-black text-rose-500 line-through opacity-70 break-words">{err.original}</p>
                      <p className="text-xs font-black text-emerald-500 inline-flex items-center gap-1 break-words"><FiArrowRight /> {err.correction}</p>
                      <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">{err.explanation}</p>
                      {Array.isArray(err.replacements) && err.replacements.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {err.replacements.slice(0, 3).map((item, i) => (
                            <span key={`${item}-${i}`} className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-600">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <InsufficientCreditsModal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} />
    </div>
  );
}
