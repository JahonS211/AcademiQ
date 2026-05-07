"use client";

import { useEffect, useState } from "react";

import { FiSun, FiMoon } from "react-icons/fi";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const shouldDark = saved === "dark";
    setDark(shouldDark);
    document.documentElement.classList.toggle("dark", shouldDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button 
      onClick={toggleTheme} 
      className="flex items-center justify-center p-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
      title={dark ? "Light Mode" : "Dark Mode"}
    >
      {dark ? <FiSun className="w-5 h-5 text-amber-500" /> : <FiMoon className="w-5 h-5 text-indigo-500" />}
    </button>
  );
}
