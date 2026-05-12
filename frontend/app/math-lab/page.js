"use client";

import { API_BASE_URL } from "../../lib/config";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCpu, FiZap } from "react-icons/fi";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { toolBaseCosts } from "../../lib/creditCosts";
import BackButton from "../../components/BackButton";
import DesmosPanel from "../../components/DesmosPanel";
import MathInline from "../../components/MathInline";
import { useI18n } from "../../lib/i18n";

const topicGroupsByLang = {
  uz: [
    {
      title: "Matematika",
      color: "text-violet-500",
      items: [
        ["1-2-3", "Bosqichma-bosqich yechimlar", "Tenglama yoki misolni bosqichma-bosqich yech"],
        ["3/4", "Boshlang'ich matematika", "2/3 + 1/6 ni hisobla va tushuntir"],
        ["x^2", "Algebra", "x^2-5x+6=0 tenglamani yech"],
        ["f(x)", "Grafiklar va chizmalar", "y=x^2 va y=2x+1 grafiklarini chiz"],
        ["int", "Hisoblash va analiz", "f(x)=x^2 hosilasini top"],
        ["geo", "Geometriya", "uchburchak yuzini formula bilan tushuntir"],
        ["y''", "Differensial tenglamalar", "y''+y=0 haqida tushuntir"],
        ["stat", "Statistika", "o'rtacha qiymat va mediana farqi"],
      ],
    },
    {
      title: "Fan va texnologiya",
      color: "text-emerald-500",
      items: [
        ["m/s", "O'lchov birliklari", "10 km ni metrga aylantir"],
        ["F", "Fizika", "F=ma formulasini tushuntir"],
        ["H2O", "Kimyo", "molyar massa qanday topiladi"],
        ["sum", "Hisoblash fanlari", "algoritm murakkabligi O(n log n)"],
      ],
    },
    {
      title: "Kundalik matematika",
      color: "text-cyan-500",
      items: [
        ["%", "Shaxsiy moliya", "15% chegirma bilan narxni hisobla"],
        ["+", "Uy-ro'zg'or matematikasi", "retsept proporsiyasini 2 baravar qil"],
        ["%", "Bugungi dunyo", "foiz o'sishni hisoblash formulasini tushuntir"],
        ["...", "Yana mavzular", "menga mos formula top"],
      ],
    },
  ],
  ru: [
    {
      title: "Математика",
      color: "text-violet-500",
      items: [
        ["1-2-3", "Пошаговые решения", "Реши уравнение или пример пошагово"],
        ["3/4", "Начальная математика", "Вычисли 2/3 + 1/6 и объясни"],
        ["x^2", "Алгебра", "Реши уравнение x^2-5x+6=0"],
        ["f(x)", "Графики и построения", "Построй графики y=x^2 и y=2x+1"],
        ["int", "Матанализ", "Найди производную f(x)=x^2"],
        ["geo", "Геометрия", "Объясни формулу площади треугольника"],
        ["y''", "Дифференциальные уравнения", "Объясни y''+y=0"],
        ["stat", "Статистика", "Разница между средним и медианой"],
      ],
    },
    {
      title: "Наука и технологии",
      color: "text-emerald-500",
      items: [
        ["m/s", "Единицы измерения", "Переведи 10 км в метры"],
        ["F", "Физика", "Объясни формулу F=ma"],
        ["H2O", "Химия", "Как найти молярную массу"],
        ["sum", "Вычислительные науки", "Сложность алгоритма O(n log n)"],
      ],
    },
    {
      title: "Повседневная математика",
      color: "text-cyan-500",
      items: [
        ["%", "Личные финансы", "Рассчитай цену со скидкой 15%"],
        ["+", "Бытовая математика", "Увеличь пропорции рецепта в 2 раза"],
        ["%", "Сегодняшний мир", "Объясни формулу процентного роста"],
        ["...", "Другие темы", "Подбери подходящую формулу"],
      ],
    },
  ],
  en: [
    {
      title: "Mathematics",
      color: "text-violet-500",
      items: [
        ["1-2-3", "Step-by-step solutions", "Solve this equation or example step by step"],
        ["3/4", "Elementary math", "Calculate 2/3 + 1/6 and explain"],
        ["x^2", "Algebra", "Solve x^2-5x+6=0"],
        ["f(x)", "Plotting and graphics", "Graph y=x^2 and y=2x+1"],
        ["int", "Calculus and analysis", "Find the derivative of f(x)=x^2"],
        ["geo", "Geometry", "Explain the triangle area formula"],
        ["y''", "Differential equations", "Explain y''+y=0"],
        ["stat", "Statistics", "Difference between mean and median"],
      ],
    },
    {
      title: "Science and technology",
      color: "text-emerald-500",
      items: [
        ["m/s", "Units and measures", "Convert 10 km to meters"],
        ["F", "Physics", "Explain the formula F=ma"],
        ["H2O", "Chemistry", "How to find molar mass"],
        ["sum", "Computational sciences", "Algorithm complexity O(n log n)"],
      ],
    },
    {
      title: "Everyday math",
      color: "text-cyan-500",
      items: [
        ["%", "Personal finance", "Calculate the price with a 15% discount"],
        ["+", "Household math", "Double a recipe proportion"],
        ["%", "Today's world", "Explain the percentage growth formula"],
        ["...", "More topics", "Find the right formula for me"],
      ],
    },
  ],
};

const copyMap = {
  uz: {
    title: "AcademiQ Math Lab",
    desc: "WolframAlpha uslubida formulalar, yechim va grafik.",
    enter: "Masala yoki ifodani kiriting",
    ready: "Yechim tayyor",
    localReady: "Lokal kalkulator orqali hisoblandi",
    failed: "Yechim chiqarishda xatolik",
    upgrade: "Bu bo'lim uchun tarifni yangilang",
    placeholder: "Masalan: x^2-5x+6=0 tenglamani yech",
    preview: "Formula ko'rinishi",
    solve: "Yechim chiqarish",
    loading: "Yechilmoqda...",
    hint: "Oddiy yozing: 2/3 + 1/6, sqrt(25), x + 1/x = 3. Sayt ularni matematik ko'rinishda chiqaradi.",
    answer: "Javob",
    step: "Qadam",
    empty: "Masalani yozing, AI yechimni qadamlar bilan ko'rsatadi.",
    credit: "kredit",
  },
  ru: {
    title: "AcademiQ Math Lab",
    desc: "Формулы, решения и графики в стиле WolframAlpha.",
    enter: "Введите задачу или выражение",
    ready: "Решение готово",
    localReady: "Посчитано локальным калькулятором",
    failed: "Ошибка при решении",
    upgrade: "Для этого раздела обновите тариф",
    placeholder: "Например: реши уравнение x^2-5x+6=0",
    preview: "Вид формулы",
    solve: "Получить решение",
    loading: "Решается...",
    hint: "Пишите просто: 2/3 + 1/6, sqrt(25), x + 1/x = 3. Сайт покажет это в математическом виде.",
    answer: "Ответ",
    step: "Шаг",
    empty: "Введите задачу, AI покажет решение по шагам.",
    credit: "кредит",
  },
  en: {
    title: "AcademiQ Math Lab",
    desc: "WolframAlpha-style formulas, solutions, and graphs.",
    enter: "Enter a problem or expression",
    ready: "Solution is ready",
    localReady: "Calculated with the local calculator",
    failed: "Could not solve",
    upgrade: "Upgrade your plan for this section",
    placeholder: "Example: solve x^2-5x+6=0",
    preview: "Formula preview",
    solve: "Solve",
    loading: "Solving...",
    hint: "Write naturally: 2/3 + 1/6, sqrt(25), x + 1/x = 3. The site will display them as math.",
    answer: "Answer",
    step: "Step",
    empty: "Enter a problem and AI will show step-by-step solution.",
    credit: "credits",
  },
};

const normalizeExpression = (value = "") => String(value)
  .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
  .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
  .replace(/,/g, ".")
  .replace(/×/g, "*")
  .replace(/÷/g, "/")
  .replace(/\^/g, "**")
  .replace(/sqrt\(/gi, "Math.sqrt(")
  .replace(/sin\(/gi, "Math.sin(")
  .replace(/cos\(/gi, "Math.cos(")
  .replace(/tan\(/gi, "Math.tan(")
  .replace(/\bpi\b/gi, "Math.PI");

const tryLocalMath = (value = "") => {
  const text = String(value)
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/hisobla|yech|top|calculate|solve/gi, " ");
  const candidate = (text.match(/[0-9+\-*/^().,\sA-Za-z]+/g) || [])
    .map((item) => item.trim())
    .filter((item) => /[0-9]/.test(item) && /[+\-*/^]|sqrt|sin|cos|tan/i.test(item))
    .sort((a, b) => b.length - a.length)[0];
  if (!candidate) return null;
  const normalized = normalizeExpression(candidate);
  if (!/^[0-9+\-*/().\sMathPIqrtincota*]+$/i.test(normalized)) return null;

  try {
    // Input is filtered to numeric operators and known Math functions above.
    // eslint-disable-next-line no-new-func
    const numeric = Function(`"use strict"; return (${normalized});`)();
    if (!Number.isFinite(Number(numeric))) return null;
    const answer = Number(numeric).toLocaleString("uz-UZ", { maximumFractionDigits: 10 });
    return {
      answer,
      steps: [
        `Ifoda: ${candidate}`,
        `Natija: ${answer}`,
        "Bu javob lokal kalkulator bilan tekshirildi.",
      ],
      expressions: [],
      note: "Backend AI javob bermaganda lokal hisoblash ishlatildi.",
    };
  } catch (_) {
    return null;
  }
};

export default function MathLabPage() {
  const ready = useRequireAuth();
  const { lang } = useI18n();
  const copy = copyMap[lang] || copyMap.en;
  const topicGroups = topicGroupsByLang[lang] || topicGroupsByLang.en;
  const [prompt, setPrompt] = useState("2/3 + 1/6 ni hisobla va tushuntir");
  const [language, setLanguage] = useState(lang === "ru" || lang === "en" ? lang : "uz");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const solve = async () => {
    if (!prompt.trim()) return toast.error(copy.enter);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API_BASE_URL}/api/math-lab/solve`, {
        prompt,
        language,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(data.result);
      if (data.remainingCredits != null) syncUserCredits(data.remainingCredits);
      toast.success(copy.ready);
    } catch (error) {
      if (error.response?.status === 403 || error.response?.data?.code === "UPGRADE_REQUIRED") {
        toast.error(error.response?.data?.message || copy.upgrade);
      } else {
        const local = tryLocalMath(prompt);
        if (local) {
          setResult(local);
          toast.success(copy.localReady);
        } else {
          toast.error(error.response?.data?.message || copy.failed);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <BackButton fallback="/tools" />
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl text-violet-500">
              <FiCpu />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">{copy.title}</h1>
              <p className="text-sm font-semibold text-slate-500">{copy.desc}</p>
            </div>
          </div>
          <span className="rounded-full bg-violet-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-violet-500">{toolBaseCosts.mathLab} {copy.credit}</span>
        </div>

        <div className="mb-8 grid gap-5 xl:grid-cols-3">
          {topicGroups.map((group) => (
            <div key={group.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <h2 className={`mb-4 text-lg font-black ${group.color}`}>{group.title}</h2>
              <div className="grid gap-2">
                {group.items.map(([symbol, label, sample]) => (
                  <button
                    key={label}
                    onClick={() => {
                      setPrompt(sample);
                      setLanguage(lang === "ru" || lang === "en" ? lang : "uz");
                    }}
                    className="group flex min-h-[62px] items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 text-left transition hover:border-violet-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className={`w-12 shrink-0 text-center text-base font-black ${group.color}`}>{symbol}</span>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-950 dark:text-slate-200">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="flex gap-2">
              {[
                ["uz", "UZ"],
                ["ru", "RU"],
                ["en", "EN"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setLanguage(value)}
                  className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest ${language === value ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input min-h-[170px] w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold leading-6 dark:border-slate-800 dark:bg-slate-950"
              placeholder={copy.placeholder}
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{copy.preview}</p>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                <MathInline text={prompt} keyPrefix="prompt-preview" />
              </div>
            </div>
            <button
              onClick={solve}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-violet-600 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-violet-500/20 disabled:opacity-50"
            >
              {loading ? copy.loading : copy.solve}
              <FiZap />
            </button>

            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-xs font-semibold leading-6 text-slate-500 dark:border-slate-800">
              {copy.hint}
            </div>
          </div>

          <div className="space-y-4">
            {result ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">{copy.answer}</p>
                <h2 className="mt-2 text-2xl font-black"><MathInline text={result.answer} keyPrefix="math-answer" /></h2>
                <div className="mt-5 space-y-3">
                  {result.steps?.map((step, index) => (
                    <div key={index} className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{copy.step} {index + 1}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200"><MathInline text={step} keyPrefix={`math-step-${index}`} /></p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400 dark:border-slate-800">
                {copy.empty}
              </div>
            )}

            <DesmosPanel expressions={result?.expressions || []} className="h-[390px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
