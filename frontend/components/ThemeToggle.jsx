"use client";

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const shouldDark = saved === "dark";
    setDark(shouldDark);
    document.documentElement.classList.toggle("dark", shouldDark);
    setMounted(true);
  }, []);

  const toggleSwitch = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  if (!mounted) {
    return <div className="shrink-0" style={{ width: 54, height: 30 }} />;
  }

  return (
    <button
      type="button"
      aria-label={dark ? "Light mode" : "Dark mode"}
      onClick={toggleSwitch}
      className="relative shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-inner transition-colors duration-150 dark:border-slate-700 dark:bg-slate-800"
      style={{ width: 54, height: 30, minWidth: 54, maxWidth: 54 }}
    >
      <span
        className={`absolute top-[3px] flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md transition-transform duration-150 ${dark ? "translate-x-[25px] bg-blue-500" : "translate-x-[3px] bg-amber-500"}`}
      >
        {dark ? <FiMoon className="h-3.5 w-3.5" /> : <FiSun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}