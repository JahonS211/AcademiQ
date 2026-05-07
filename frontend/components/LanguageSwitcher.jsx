"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "../lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { FiGlobe, FiChevronDown, FiCheck } from "react-icons/fi";

export default function LanguageSwitcher({ direction = "up", compact = false }) {
  const { lang, setLang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: "uz", label: "O'zbek" },
    { code: "ru", label: "Русский" },
    { code: "en", label: "English" },
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${compact ? "w-10 h-10 justify-center p-0" : ""}`}
      >
        <FiGlobe className={`w-4 h-4 text-indigo-500 ${compact ? "shrink-0" : ""}`} />
        {!compact && (
          <>
            <span>{currentLang.code}</span>
            <FiChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute ${direction === "down" ? "top-full mt-3" : "bottom-full mb-3"} left-0 w-36 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[100]`}
          >
            <div className="p-2 space-y-1">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    lang === l.code
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {l.label}
                  {lang === l.code && <FiCheck className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
