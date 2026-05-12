"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiDivideCircle } from "react-icons/fi";
import useRequireAuth from "../../lib/useRequireAuth";
import BackButton from "../../components/BackButton";
import { useI18n } from "../../lib/i18n";

const copyMap = {
  uz: {
    title: "Kalkulator",
    desc: "Tez hisoblash va asosiy formulalar.",
    expression: "Ifoda",
    check: "Ifodani tekshiring",
    back: "O'chirish",
    clear: "Tozalash",
    guide: "Qo'llanma",
    history: "Tarix",
    empty: "Hisoblashlar hali yo'q.",
    lines: ["sqrt(25) ildizni hisoblaydi.", "2^3 darajani hisoblaydi.", "sin(0), cos(0), tan(1) trigonometrik funksiyalarni qo'llab-quvvatlaydi.", "pi qiymatini ishlatish mumkin."],
  },
  ru: {
    title: "Калькулятор",
    desc: "Быстрые вычисления и основные формулы.",
    expression: "Выражение",
    check: "Проверьте выражение",
    back: "Удалить",
    clear: "Очистить",
    guide: "Инструкция",
    history: "История",
    empty: "Вычислений пока нет.",
    lines: ["sqrt(25) вычисляет корень.", "2^3 вычисляет степень.", "sin(0), cos(0), tan(1) поддерживают тригонометрию.", "Можно использовать значение pi."],
  },
  en: {
    title: "Calculator",
    desc: "Quick calculations and core formulas.",
    expression: "Expression",
    check: "Check the expression",
    back: "Backspace",
    clear: "Clear",
    guide: "Guide",
    history: "History",
    empty: "No calculations yet.",
    lines: ["sqrt(25) calculates a square root.", "2^3 calculates a power.", "sin(0), cos(0), tan(1) support trigonometry.", "You can use pi."],
  },
};

const buttons = ["7", "8", "9", "/", "sqrt(", "4", "5", "6", "*", "^", "1", "2", "3", "-", "(", "0", ".", "=", "+", ")"];

const toJsExpression = (value) => String(value)
  .replace(/\^/g, "**")
  .replace(/sqrt\(/g, "Math.sqrt(")
  .replace(/sin\(/g, "Math.sin(")
  .replace(/cos\(/g, "Math.cos(")
  .replace(/tan\(/g, "Math.tan(")
  .replace(/pi/gi, "Math.PI");

const calculate = (expression) => {
  const safe = String(expression).replace(/[^0-9+\-*/().,\s^a-zA-Z]/g, "");
  const jsExpression = toJsExpression(safe);
  // Calculator input is restricted above to numbers, operators, and known Math functions.
  // eslint-disable-next-line no-new-func
  const value = Function(`"use strict"; return (${jsExpression})`)();
  if (!Number.isFinite(Number(value))) throw new Error("Invalid result");
  return Number(value).toLocaleString("uz-UZ", { maximumFractionDigits: 8 });
};

export default function CalculatorPage() {
  const ready = useRequireAuth();
  const { lang } = useI18n();
  const copy = copyMap[lang] || copyMap.en;
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState([]);

  const display = useMemo(() => expression || "0", [expression]);

  const press = (value) => {
    if (value === "back") {
      setExpression((current) => current.slice(0, -1));
      return;
    }
    if (value === "clear") {
      setExpression("");
      return;
    }
    if (value === "=") {
      try {
        const result = calculate(expression);
        setHistory((items) => [{ expression, result }, ...items].slice(0, 8));
        setExpression(result.replace(/\s/g, ""));
      } catch (_) {
        toast.error(copy.check);
      }
      return;
    }
    setExpression((current) => current + value);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        press(key);
        return;
      }
      if (["+", "-", "*", "/", ".", "(", ")", "^"].includes(key)) {
        event.preventDefault();
        press(key);
        return;
      }
      if (key === "Enter" || key === "=") {
        event.preventDefault();
        press("=");
        return;
      }
      if (key === "Backspace") {
        event.preventDefault();
        press("back");
        return;
      }
      if (key === "Delete" || key === "Escape") {
        event.preventDefault();
        press("clear");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expression]);

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <BackButton fallback="/tools" />
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl text-cyan-500">
              <FiDivideCircle />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">{copy.title}</h1>
              <p className="text-sm font-semibold text-slate-500">{copy.desc}</p>
            </div>
          </div>

          <div className="mb-4 min-h-[86px] rounded-2xl bg-slate-950 p-4 text-right text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy.expression}</p>
            <p className="mt-2 break-all text-3xl font-black">{display}</p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {buttons.map((button) => (
              <button
                key={button}
                onClick={() => press(button)}
                className={`min-h-[54px] rounded-2xl text-sm font-black transition active:scale-95 ${button === "=" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"}`}
              >
                {button}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => press("back")}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {copy.back}
            </button>
            <button
              onClick={() => press("clear")}
              className="rounded-2xl bg-rose-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500"
            >
              {copy.clear}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-black uppercase tracking-tight">{copy.guide}</h2>
          <div className="grid gap-3 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
            {copy.lines.map((line) => <p key={line}>{line}</p>)}
          </div>

          <h3 className="mt-8 mb-3 text-sm font-black uppercase tracking-widest text-slate-400">{copy.history}</h3>
          <div className="space-y-2">
            {history.map((item, index) => (
              <div key={`${item.expression}-${index}`} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-xs font-bold text-slate-500">{item.expression}</p>
                <p className="mt-1 text-lg font-black">{item.result}</p>
              </div>
            ))}
            {history.length === 0 && <p className="text-sm font-semibold text-slate-400">{copy.empty}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
