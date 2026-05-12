"use client";

import { API_BASE_URL } from "../../lib/config";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { toolBaseCosts } from "../../lib/creditCosts";
import { FiFolder, FiFileText, FiSearch, FiZap, FiCheckCircle, FiArchive, FiTrash2, FiRefreshCw, FiArrowRight, FiEdit3, FiBarChart2, FiDivideCircle, FiCpu } from "react-icons/fi";
import CustomSelect from "../../components/CustomSelect";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";

const convertOptions = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "svg", label: "SVG" },
];

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

const toolCopy = {
  uz: {
    min: "Min.",
    credit: "kredit",
    free: "Bepul",
    open: "Ochish",
    toolsHint: "Bugungi darsingiz uchun kerakli yordamchini tanlang va vazifani tushunarliroq, tezroq bajaring.",
    desmosTitle: "Desmos Grafika",
    desmosDesc: "Funksiya, tenglama va nuqtalarni interaktiv grafikda chizing.",
    desmosMeta: "Grafik kalkulator",
    calculatorTitle: "Kalkulator",
    calculatorDesc: "Kasr, ildiz, daraja va asosiy hisob-kitoblarni tez bajaring.",
    calculatorMeta: "Bepul hisoblash",
    mathLabTitle: "Thinky Math Lab",
    mathLabDesc: "WolframAlpha uslubida formulalar, kategoriyalar va bosqichli yechim.",
    mathLabMeta: "Formula markazi",
  },
  ru: {
    min: "Мин.",
    credit: "кредит",
    free: "Бесплатно",
    open: "Открыть",
    toolsHint: "Выберите помощника для сегодняшнего урока и выполняйте задания быстрее и понятнее.",
    desmosTitle: "Графики Desmos",
    desmosDesc: "Стройте функции, уравнения и точки в интерактивном графике.",
    desmosMeta: "Графический калькулятор",
    calculatorTitle: "Калькулятор",
    calculatorDesc: "Быстро считайте дроби, корни, степени и базовые выражения.",
    calculatorMeta: "Бесплатный расчет",
    mathLabTitle: "Thinky Math Lab",
    mathLabDesc: "Формулы, категории и пошаговые решения в стиле WolframAlpha.",
    mathLabMeta: "Центр формул",
  },
  en: {
    min: "Min.",
    credit: "credit",
    free: "Free",
    open: "Open",
    toolsHint: "Choose the right study helper for today and finish assignments faster with clearer explanations.",
    desmosTitle: "Desmos Graphs",
    desmosDesc: "Graph functions, equations, and points in an interactive calculator.",
    desmosMeta: "Graphing calculator",
    calculatorTitle: "Calculator",
    calculatorDesc: "Quickly calculate fractions, roots, powers, and basic expressions.",
    calculatorMeta: "Free calculation",
    mathLabTitle: "Thinky Math Lab",
    mathLabDesc: "WolframAlpha-style formulas, categories, and step-by-step solutions.",
    mathLabMeta: "Formula center",
  },
};

const minCreditLabel = (value, copy) => Number(value) > 0 ? `${copy.min} ${value} ${copy.credit}` : copy.free;

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function ToolsPage() {
  const { t, lang } = useI18n();
  const copy = toolCopy[lang] || toolCopy.en;
  const ready = useRequireAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState("");
  const [ocrResult, setOcrResult] = useState("");
  const [convertTarget, setConvertTarget] = useState("png");
  const [showCreditModal, setShowCreditModal] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: false,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".svg"],
      "application/pdf": [".pdf"],
    },
  });

  const handleClear = () => {
    setFile(null);
    setOcrResult("");
  };

  const runTool = async (type) => {
    if (!file) return toast.error(t("dropzone"));
    setLoading(type);
    setOcrResult("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = type === "pdf" ? "image-to-pdf" : "image-to-text";

      const { data } = await axios.post(`${API_BASE_URL}/api/${endpoint}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.resultUrl) {
        window.open(`${API_BASE_URL}${data.resultUrl}`, "_blank");
        toast.success(t("processSuccess"));
      } else if (data.extractedText) {
        setOcrResult(data.extractedText);
        toast.success(t("processSuccess"));
      }
      syncUserCredits(data.remainingCredits);
    } catch (error) {
      const msg = error.response?.data?.message || t("processFailed");
      if (msg.toLowerCase().includes("kredit") || msg.toLowerCase().includes("credit")) {
        setShowCreditModal(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading("");
    }
  };

  const runConverter = async () => {
    if (!file) return toast.error(t("dropzone"));
    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".svg")) {
      return toast.error("Konvert uchun rasm fayl tanlang");
    }

    setLoading("convert");
    try {
      const dataUrl = await readAsDataUrl(file);
      const baseName = file.name.replace(/\.[^.]+$/, "") || "converted";
      const isSvg = file.type.includes("svg") || file.name.toLowerCase().endsWith(".svg");

      if (convertTarget === "svg") {
        if (isSvg) {
          downloadBlob(file, `${baseName}.svg`);
        } else {
          const img = await loadImage(dataUrl);
          const width = img.naturalWidth || 1200;
          const height = img.naturalHeight || 800;
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image href="${dataUrl}" width="${width}" height="${height}"/></svg>`;
          downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${baseName}.svg`);
        }
      } else {
        const img = await loadImage(dataUrl);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 1200;
        canvas.height = img.naturalHeight || 800;
        const ctx = canvas.getContext("2d");
        if (convertTarget === "jpg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mime = convertTarget === "jpg" ? "image/jpeg" : "image/png";
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92));
        if (!blob) throw new Error("Konvert qilishda xatolik");
        downloadBlob(blob, `${baseName}.${convertTarget}`);
      }

      toast.success("Fayl konvert qilindi");
    } catch (error) {
      toast.error("Konvert qilishda xatolik yuz berdi");
    } finally {
      setLoading("");
    }
  };

  const educationalTools = [
    {
      href: "/desmos",
      title: copy.desmosTitle,
      desc: copy.desmosDesc,
      cost: toolBaseCosts.mathLab,
      icon: <FiBarChart2 />,
      iconClass: "bg-indigo-500/12 text-indigo-500",
      lineClass: "from-indigo-400/0 via-indigo-400 to-indigo-400/0",
      badgeClass: "bg-indigo-500/12 text-indigo-500 border-indigo-500/20",
      ctaClass: "bg-indigo-600 text-white shadow-indigo-600/20",
      meta: copy.desmosMeta,
    },
    {
      href: "/calculator",
      title: copy.calculatorTitle,
      desc: copy.calculatorDesc,
      cost: 0,
      icon: <FiDivideCircle />,
      iconClass: "bg-cyan-500/12 text-cyan-500",
      lineClass: "from-cyan-400/0 via-cyan-400 to-cyan-400/0",
      badgeClass: "bg-cyan-500/12 text-cyan-500 border-cyan-500/20",
      ctaClass: "bg-cyan-600 text-white shadow-cyan-600/20",
      meta: copy.calculatorMeta,
    },
    {
      href: "/math-lab",
      title: copy.mathLabTitle,
      desc: copy.mathLabDesc,
      cost: toolBaseCosts.mathLab,
      icon: <FiCpu />,
      iconClass: "bg-violet-500/12 text-violet-500",
      lineClass: "from-violet-400/0 via-violet-400 to-violet-400/0",
      badgeClass: "bg-violet-500/12 text-violet-500 border-violet-500/20",
      ctaClass: "bg-violet-600 text-white shadow-violet-600/20",
      meta: copy.mathLabMeta,
    },
    {
      href: "/homework-solver",
      title: "Homework Solver",
      desc: t("homeworkSolverDesc"),
      cost: toolBaseCosts.homework,
      icon: <FiZap />,
      iconClass: "bg-amber-500/12 text-amber-500",
      lineClass: "from-amber-400/0 via-amber-400 to-amber-400/0",
      badgeClass: "bg-amber-500/12 text-amber-500 border-amber-500/20",
      ctaClass: "bg-amber-500 text-white shadow-amber-500/20",
      meta: "Masala va uy vazifa",
    },
    {
      href: "/flashcards",
      title: "Flashcards",
      desc: "Mavzu bo'yicha interaktiv kartalar yarating.",
      cost: toolBaseCosts.flashcards,
      icon: <FiFileText />,
      iconClass: "bg-indigo-500/12 text-indigo-500",
      lineClass: "from-indigo-400/0 via-indigo-400 to-indigo-400/0",
      badgeClass: "bg-indigo-500/12 text-indigo-500 border-indigo-500/20",
      ctaClass: "bg-indigo-600 text-white shadow-indigo-600/20",
      meta: "O'qish kartalari",
    },
    {
      href: "/grammarly",
      title: "Grammarly AI",
      desc: "Matndagi xatolarni tuzatish va stilni yaxshilash.",
      cost: toolBaseCosts.grammarly,
      icon: <FiCheckCircle />,
      iconClass: "bg-emerald-500/12 text-emerald-500",
      lineClass: "from-emerald-400/0 via-emerald-400 to-emerald-400/0",
      badgeClass: "bg-emerald-500/12 text-emerald-500 border-emerald-500/20",
      ctaClass: "bg-emerald-600 text-white shadow-emerald-600/20",
      meta: "Matn tahriri",
    },
    {
      href: "/ai-detector",
      title: "AI Detector",
      desc: "Matn sun'iy intellekt tomonidan yozilganini tekshiring.",
      cost: toolBaseCosts.aiDetector,
      icon: <FiSearch />,
      iconClass: "bg-blue-500/12 text-blue-500",
      lineClass: "from-blue-400/0 via-blue-400 to-blue-400/0",
      badgeClass: "bg-blue-500/12 text-blue-500 border-blue-500/20",
      ctaClass: "bg-blue-600 text-white shadow-blue-600/20",
      meta: "AI tahlil",
    },
    {
      href: "/humanizer",
      title: "Humanizer",
      desc: "AI matnni tabiiyroq va ravonroq qilib qayta yozing.",
      cost: toolBaseCosts.humanizer,
      icon: <FiEdit3 />,
      iconClass: "bg-fuchsia-500/12 text-fuchsia-500",
      lineClass: "from-fuchsia-400/0 via-fuchsia-400 to-fuchsia-400/0",
      badgeClass: "bg-fuchsia-500/12 text-fuchsia-500 border-fuchsia-500/20",
      ctaClass: "bg-fuchsia-600 text-white shadow-fuchsia-600/20",
      meta: "Tabiiy matn",
    },
    {
      href: "/zip-tool",
      title: "ZIP Arxivator",
      desc: "Ko'plab fayllarni bitta arxivga to'plang.",
      cost: toolBaseCosts.zip,
      icon: <FiArchive />,
      iconClass: "bg-slate-500/12 text-slate-500 dark:text-slate-300",
      lineClass: "from-slate-400/0 via-slate-400 to-slate-400/0",
      badgeClass: "bg-slate-500/12 text-slate-500 dark:text-slate-300 border-slate-500/20",
      ctaClass: "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-slate-900/10",
      meta: "Fayl arxivi",
    },
  ];
  if (!ready) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div className="card p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 overflow-visible">
        <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter">{t("fileTools")}</h1>
        
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-[2rem] p-8 transition-colors duration-150 border-2 ${
            isDragActive ? "bg-brandA/5 border-brandA border-solid" : "bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex justify-center text-4xl mb-4 text-slate-400 dark:text-slate-500">
            <FiFolder />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {file ? `${t("selected")}: ${file.name}` : t("dropzone")}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <button 
          className="card group min-h-[260px] border-none p-7 text-center shadow-xl transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-2xl" 
          onClick={() => runTool("pdf")}
          disabled={loading === "pdf"}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-3xl text-rose-600 transition-transform duration-200 group-hover:rotate-6 dark:bg-rose-900/20">
            <FiFileText />
          </div>
          <h3 className="inline-flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest">Rasm <FiArrowRight className="h-4 w-4" /> PDF</h3>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="rounded-lg bg-rose-500 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white">{toolBaseCosts.imageToPdf} kredit</span>
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500">
            {loading === "pdf" ? t("loading") : "PDF fayl yaratish"}
          </p>
        </button>

        <button 
          className="card group min-h-[260px] border-none p-7 text-center shadow-xl transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-2xl" 
          onClick={() => runTool("ocr")}
          disabled={loading === "ocr"}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl text-blue-600 transition-transform duration-200 group-hover:scale-105 dark:bg-blue-900/20">
            <FiSearch />
          </div>
          <h3 className="inline-flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest">Rasm <FiArrowRight className="h-4 w-4" /> Matn</h3>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="rounded-lg bg-blue-500 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white">{toolBaseCosts.imageToText} kredit</span>
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500">
            {loading === "ocr" ? t("loading") : "Matnni ajratish"}
          </p>
        </button>

        <div className="card group min-h-[260px] border-none p-7 text-center shadow-xl transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-600 transition-transform duration-200 group-hover:rotate-90 dark:bg-emerald-900/20">
            <FiRefreshCw />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest">Konvertor</h3>
          <div className="mt-5">
            <CustomSelect value={convertTarget} onChange={setConvertTarget} options={convertOptions} />
          </div>
          <button
            onClick={runConverter}
            disabled={loading === "convert"}
            className="mt-4 w-full rounded-2xl bg-emerald-500 py-3.5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            {loading === "convert" ? t("loading") : "Konvert"}
          </button>
        </div>
      </div>

      {ocrResult && (
        <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brandA animate-ping" />
              {t("result")}
            </h3>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-colors duration-150"
            >
              <FiTrash2 />
              Tozalash
            </button>
          </div>
          <pre className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-medium text-sm whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100">
            {ocrResult}
          </pre>
          <button 
            className="mt-6 px-6 py-2 bg-brandA/10 text-brandA rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brandA hover:text-white transition-colors duration-150"
            onClick={() => {
              navigator.clipboard.writeText(ocrResult);
              toast.success(t("copied"));
            }}
          >
            {t("copy")}
          </button>
        </div>
      )}

      <section className="pt-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brandA">Thinky AI</p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{t("educationalTools")}</h2>
          </div>
          <p className="max-w-md text-sm font-semibold text-slate-500 dark:text-slate-400">{copy.toolsHint}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {educationalTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative flex min-h-[292px] flex-col overflow-hidden rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-8 shadow-[0_22px_55px_rgba(15,23,42,0.08)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1.5 hover:border-brandA/30 hover:shadow-[0_30px_75px_rgba(79,70,229,0.16)] dark:border-slate-800/80 dark:from-slate-900 dark:to-slate-950"
            >
              <div className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r ${tool.lineClass}`} />
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${tool.iconClass}`}>
                  {tool.icon}
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider ${tool.badgeClass}`}>
                  {minCreditLabel(tool.cost, copy)}
                </span>
              </div>

              <div className="mt-6 min-w-0">
                <h3 className="text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white">{tool.title}</h3>
                <p className="mt-4 min-h-[58px] text-[15px] font-semibold leading-7 text-slate-500 dark:text-slate-400">{tool.desc}</p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-4 pt-8">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{tool.meta}</span>
                <span className={`inline-flex h-12 min-w-[128px] items-center justify-center gap-2 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest shadow-lg transition-transform duration-150 group-hover:translate-x-0.5 ${tool.ctaClass}`}>
                  {copy.open}
                  <FiArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <InsufficientCreditsModal 
        isOpen={showCreditModal} 
        onClose={() => setShowCreditModal(false)} 
      />
    </div>
  );
}
