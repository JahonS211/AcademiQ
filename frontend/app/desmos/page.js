"use client";

import { API_BASE_URL } from "../../lib/config";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { FiBarChart2, FiPaperclip, FiZap } from "react-icons/fi";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { toolBaseCosts } from "../../lib/creditCosts";
import BackButton from "../../components/BackButton";
import DesmosPanel from "../../components/DesmosPanel";
import { useI18n } from "../../lib/i18n";

const DESMOS_PIN_KEY = "desmos-mini-pinned";

const copyMap = {
  uz: {
    title: "Desmos Grafika",
    desc: "Funksiya, tenglama va nuqtalarni grafikda ko'ring.",
    badge: "kredit AI yordam",
    pin: "Mini Desmos",
    pinTitle: "Mini Desmosni skrepka bilan qistirish",
    pinned: "Mini Desmos yoqildi",
    unpinned: "Mini Desmos o'chirildi",
    placeholder: "Masalan: y=x^2 va y=2x+1 kesishishini ko'rsat",
    run: "AI bilan Desmosga chiqarish",
    loading: "Hisoblanmoqda...",
    enter: "Ifoda yoki topshiriqni kiriting",
    ready: "Desmos uchun ifodalar tayyor",
    failed: "AI yordamida chiqarib bo'lmadi",
    result: "Natija",
    guide: "Desmos y=x^2, y=sin(x), x^2+y^2=9, (1,2) kabi ifodalarni chizadi. AI topshiriqdan mos ifodalarni ajratib, grafik oynasiga qo'yadi.",
    types: {
      graphing: "Grafik",
      scientific: "Ilmiy",
      fourFunction: "Bazada hisoblash",
      geometry: "Geometriya",
      graphing3d: "3D grafik",
    },
  },
  ru: {
    title: "Графики Desmos",
    desc: "Стройте функции, уравнения и точки на графике.",
    badge: "кредит за AI-помощь",
    pin: "Мини Desmos",
    pinTitle: "Закрепить мини Desmos скрепкой",
    pinned: "Мини Desmos включен",
    unpinned: "Мини Desmos выключен",
    placeholder: "Например: покажи пересечение y=x^2 и y=2x+1",
    run: "Отправить в Desmos через AI",
    loading: "Вычисляется...",
    enter: "Введите выражение или задание",
    ready: "Выражения для Desmos готовы",
    failed: "Не удалось подготовить через AI",
    result: "Результат",
    guide: "Desmos строит выражения вроде y=x^2, y=sin(x), x^2+y^2=9, (1,2). AI выделяет подходящие выражения и добавляет их в окно графика.",
    types: {
      graphing: "График",
      scientific: "Научный",
      fourFunction: "Базовый счет",
      geometry: "Геометрия",
      graphing3d: "3D график",
    },
  },
  en: {
    title: "Desmos Graphs",
    desc: "Graph functions, equations, and points.",
    badge: "credit AI help",
    pin: "Mini Desmos",
    pinTitle: "Pin Mini Desmos with the paperclip",
    pinned: "Mini Desmos enabled",
    unpinned: "Mini Desmos disabled",
    placeholder: "Example: show the intersection of y=x^2 and y=2x+1",
    run: "Send to Desmos with AI",
    loading: "Calculating...",
    enter: "Enter an expression or task",
    ready: "Desmos expressions are ready",
    failed: "Could not prepare with AI",
    result: "Result",
    guide: "Desmos graphs expressions like y=x^2, y=sin(x), x^2+y^2=9, (1,2). AI extracts matching expressions and places them into the graph.",
    types: {
      graphing: "Graphing",
      scientific: "Scientific",
      fourFunction: "Four Function",
      geometry: "Geometry",
      graphing3d: "3D Graphing",
    },
  },
};

export default function DesmosPage() {
  const ready = useRequireAuth();
  const { lang } = useI18n();
  const copy = copyMap[lang] || copyMap.en;
  const [prompt, setPrompt] = useState("y=x^2 va y=2x+1 grafiklarini chiz");
  const [expressions, setExpressions] = useState(["y=x^2", "y=2x+1"]);
  const [calculatorType, setCalculatorType] = useState("graphing");
  const [miniPinned, setMiniPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setMiniPinned(localStorage.getItem(DESMOS_PIN_KEY) === "1");
  }, []);

  const calculatorOptions = [
    { value: "graphing", label: copy.types.graphing },
    { value: "scientific", label: copy.types.scientific },
    { value: "fourFunction", label: copy.types.fourFunction },
    { value: "geometry", label: copy.types.geometry },
    { value: "graphing3d", label: copy.types.graphing3d },
  ];

  const toggleMiniDesmos = () => {
    const next = !miniPinned;
    setMiniPinned(next);
    localStorage.setItem(DESMOS_PIN_KEY, next ? "1" : "0");
    window.dispatchEvent(new Event("desmos-mini-pin"));
    toast.success(next ? copy.pinned : copy.unpinned);
  };

  const runAI = async () => {
    if (!prompt.trim()) return toast.error(copy.enter);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API_BASE_URL}/api/math-lab/solve`, {
        prompt,
        language: lang === "ru" || lang === "en" ? lang : "uz",
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(data.result);
      if (data.result?.expressions?.length) setExpressions(data.result.expressions);
      if (data.remainingCredits != null) syncUserCredits(data.remainingCredits);
      toast.success(copy.ready);
    } catch (error) {
      toast.error(error.response?.data?.message || copy.failed);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-5">
      <BackButton fallback="/tools" />
      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl text-indigo-500">
              <FiBarChart2 />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">{copy.title}</h1>
              <p className="text-sm font-semibold text-slate-500">{copy.desc}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleMiniDesmos}
              title={copy.pinTitle}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${miniPinned ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              <FiPaperclip className="text-sm" />
              {copy.pin}
            </button>
            <span className="rounded-full bg-indigo-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-500">{toolBaseCosts.mathLab} {copy.badge}</span>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {calculatorOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setCalculatorType(option.value)}
              className={`rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${calculatorType === option.value ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)]">
          <div className="space-y-4 lg:max-h-[760px] lg:overflow-y-auto lg:pr-1">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input min-h-[118px] w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold leading-6 dark:border-slate-800 dark:bg-slate-950"
              placeholder={copy.placeholder}
            />
            <button
              onClick={runAI}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? copy.loading : copy.run}
              <FiZap />
            </button>
            {result && (
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <h3 className="mb-2 text-sm font-black">{copy.result}</h3>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{result.answer}</p>
                <div className="mt-3 space-y-2">
                  {result.steps?.map((step, index) => (
                    <p key={index} className="text-xs font-semibold text-slate-500">{index + 1}. {step}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-xs font-semibold leading-6 text-slate-500 dark:border-slate-800">
              {copy.guide}
            </div>
          </div>

          <DesmosPanel expressions={expressions} calculatorType={calculatorType} className="h-[72vh] min-h-[620px] xl:min-h-[740px]" />
        </div>
      </div>
    </div>
  );
}
