"use client";

import { API_BASE_URL } from "../../lib/config";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { textToolCreditCost } from "../../lib/creditCosts";
import { FiActivity, FiBarChart2, FiEye, FiTrash2, FiZap } from "react-icons/fi";
import CustomSelect from "../../components/CustomSelect";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";
import BackButton from "../../components/BackButton";

const langOptions = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Ruscha" },
  { value: "en", label: "English" },
];

const normalizeScore = (value) => {
  let score = Number(String(value ?? 0).replace("%", "").replace(",", "."));
  if (!Number.isFinite(score)) return 0;
  if (score > 0 && score <= 1) score *= 100;
  return Math.min(100, Math.max(0, Math.round(score)));
};

const verdictText = (score, language) => {
  const labels = {
    uz: ["Inson yozgan bo'lishi ehtimoli yuqori", "AI yordami aralashgan bo'lishi mumkin", "AI yozgan bo'lishi ehtimoli yuqori"],
    ru: ["?????? ????? ???????? ?????????", "????????, ???????? ??????????? AI", "?????? ????? ???????? AI"],
    en: ["Likely written by a human", "Potentially AI-assisted", "Highly likely AI-generated"],
  }[language] || [];

  if (score >= 70) return labels[2];
  if (score >= 40) return labels[1];
  return labels[0];
};

export default function AiDetectorPage() {
  const ready = useRequireAuth();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("uz");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const creditCost = useMemo(() => textToolCreditCost(8, text, 1100, 16), [text]);
  const score = normalizeScore(result?.aiScore);
  const indicators = Array.isArray(result?.indicators) ? result.indicators : [];
  const scoreTone = score >= 70
    ? { text: "text-rose-500", bg: "bg-rose-500", soft: "bg-rose-500/10", border: "border-rose-500/20" }
    : score >= 40
      ? { text: "text-amber-500", bg: "bg-amber-500", soft: "bg-amber-500/10", border: "border-amber-500/20" }
      : { text: "text-emerald-500", bg: "bg-emerald-500", soft: "bg-emerald-500/10", border: "border-emerald-500/20" };

  const handleDetect = async () => {
    if (!text.trim()) return toast.error("Iltimos, matnni kiriting");
    if (text.trim().length < 50) return toast.error("Matn kamida 50 ta belgidan iborat bo'lishi kerak");

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API_BASE_URL}/api/ai-detector/detect`, {
        text,
        language,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setResult({ ...data.result, aiScore: normalizeScore(data.result?.aiScore) });
        toast.success("Tahlil yakunlandi");
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

  if (!ready) return null;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-7">
      <BackButton fallback="/tools" />

      <header className="card p-6 md:p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-full border border-indigo-500/20">
              <FiEye className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Authenticity Radar</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none">AI Detector</h1>
              <p className="mt-3 text-slate-500 font-medium text-sm max-w-2xl">
                Matnni tanlangan tilda tekshiradi, AI ehtimolini 0-100 foizda ko'rsatadi va aniq sabablarni beradi.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-56">
            <CustomSelect value={language} onChange={setLanguage} options={langOptions} label="Javob tili" />
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-7">
        <section className="lg:col-span-7 card p-6 md:p-8 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem] flex flex-col gap-5 overflow-visible">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tekshirish uchun matn</label>
          <textarea
            className="min-h-[340px] w-full py-5 px-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/30 transition-all outline-none font-bold text-sm shadow-inner resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
            placeholder="Kamida 50 ta belgidan iborat matnni kiriting..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              onClick={handleDetect}
              disabled={loading}
              className="min-h-[56px] rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-black uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? "Tahlil qilinmoqda..." : (
                <>
                  Tahlil qilish <FiZap className="text-amber-400" />
                  <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[9px] tracking-tight">{creditCost} kredit</span>
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

        <aside className="lg:col-span-5 space-y-6">
          <section className="card p-6 md:p-8 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-7">Tahlil natijalari</h3>
            {!result ? (
              <div className="flex flex-col items-center justify-center text-center opacity-40 py-12">
                <FiActivity className="text-5xl mb-4" />
                <p className="text-sm font-bold max-w-[220px]">Matnni kiriting va tahlil tugmasini bosing</p>
              </div>
            ) : (
              <div className="space-y-7">
                <div className="flex items-center justify-center">
                  <div
                    className={`grid h-56 w-56 place-items-center rounded-full p-4 shadow-inner ${scoreTone.text}`}
                    style={{ background: `conic-gradient(currentColor ${score * 3.6}deg, rgba(148,163,184,0.18) 0deg)` }}
                  >
                    <div className="grid h-full w-full place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(148,163,184,0.15)] dark:bg-slate-900">
                      <div>
                        <div className={`text-5xl font-black ${scoreTone.text}`}>{score}%</div>
                        <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">AI ehtimoli</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`rounded-3xl border p-5 ${scoreTone.soft} ${scoreTone.border}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Xulosa</p>
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${scoreTone.bg}`} />
                    <p className="text-sm font-black uppercase tracking-tight">{result.verdict || verdictText(score, language)}</p>
                  </div>
                  {result.shortReason && <p className="mt-4 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-200">{result.shortReason}</p>}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aniq sabablar</p>
                  {indicators.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className="text-xs font-black leading-5 text-indigo-500">{item.value}</span>
                      </div>
                      {item.explanation && <p className="mt-2 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-slate-300">{item.explanation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="p-7 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-600/20">
            <div className="flex items-center gap-4 mb-4">
              <FiBarChart2 className="text-3xl" />
              <h4 className="text-lg font-black uppercase tracking-tight">Aniq tahlil</h4>
            </div>
            <p className="text-xs font-bold text-indigo-100 leading-relaxed">
              Natija ehtimoliy baho: gap ritmi, takrorlanish, uslub, aniqlik va tabiiy ifoda belgilariga qarab hisoblanadi.
            </p>
          </section>
        </aside>
      </div>

      <InsufficientCreditsModal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} />
    </div>
  );
}
