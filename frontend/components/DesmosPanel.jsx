"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";

const copyMap = {
  uz: { loading: "Desmos yuklanmoqda..." },
  ru: { loading: "Desmos загружается..." },
  en: { loading: "Loading Desmos..." },
};

export default function DesmosPanel({ expressions = [], className = "", calculatorType = "graphing" }) {
  const { lang } = useI18n();
  const copy = copyMap[lang] || copyMap.en;
  const elRef = useRef(null);
  const calculatorRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const fallbackSrc = {
    graphing: "https://www.desmos.com/calculator?embed",
    scientific: "https://www.desmos.com/scientific?embed",
    fourFunction: "https://www.desmos.com/fourfunction?embed",
    geometry: "https://www.desmos.com/geometry?embed",
    graphing3d: "https://www.desmos.com/3d?embed",
  }[calculatorType] || "https://www.desmos.com/calculator?embed";

  useEffect(() => {
    if (window.Desmos) {
      setReady(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      if (!window.Desmos) setFallback(true);
    }, 4500);

    const existing = document.querySelector("script[data-desmos-api='true']");
    if (existing) {
      existing.addEventListener("load", () => {
        window.clearTimeout(timeout);
        setReady(true);
      }, { once: true });
      existing.addEventListener("error", () => {
        window.clearTimeout(timeout);
        setFallback(true);
      }, { once: true });
      return () => window.clearTimeout(timeout);
    }

    const script = document.createElement("script");
    script.src = "https://www.desmos.com/api/v1.12/calculator.js?apiKey=09d7ab9423614df7884eeadac45314da";
    script.async = true;
    script.dataset.desmosApi = "true";
    script.onload = () => {
      window.clearTimeout(timeout);
      setReady(true);
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      setFallback(true);
    };
    document.body.appendChild(script);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!ready || !elRef.current || calculatorRef.current) return;
    try {
      const constructors = {
        graphing: window.Desmos.GraphingCalculator,
        scientific: window.Desmos.ScientificCalculator,
        fourFunction: window.Desmos.FourFunctionCalculator,
        geometry: window.Desmos.Geometry,
        graphing3d: window.Desmos.Graphing3D,
      };
      const Calculator = constructors[calculatorType] || constructors.graphing;
      calculatorRef.current = Calculator(elRef.current, {
        expressions: true,
        settingsMenu: true,
        zoomButtons: true,
        lockViewport: false,
        border: true,
      });
    } catch (_) {
      setFallback(true);
      return;
    }

    return () => {
      calculatorRef.current?.destroy?.();
      calculatorRef.current = null;
    };
  }, [ready, calculatorType]);

  useEffect(() => {
    if (!calculatorRef.current || !calculatorRef.current.setExpression) return;
    calculatorRef.current.setBlank();
    const list = expressions.length ? expressions : ["y=x^2", "y=\\sqrt{x+4}", "y=\\frac{1}{2}x+1"];
    list.slice(0, 8).forEach((latex, index) => {
      calculatorRef.current.setExpression({ id: `thinky-${index}`, latex: String(latex) });
    });
  }, [expressions, ready, calculatorType]);

  return (
    <div className={`relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {fallback ? (
        <iframe
          title="Desmos Graphing Calculator"
          src={fallbackSrc}
          className="h-full min-h-[360px] w-full border-0 bg-white"
          allow="clipboard-write"
        />
      ) : (
        <div ref={elRef} className="h-full min-h-[360px] w-full" />
      )}
      {!ready && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-black uppercase tracking-widest text-slate-500 backdrop-blur dark:bg-slate-950/80">
          {copy.loading}
        </div>
      )}
    </div>
  );
}
