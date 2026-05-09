"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiCheck } from "react-icons/fi";

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Tanlang...", 
  label = "",
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateDropdownPosition = useCallback(() => {
    if (!buttonRef.current || typeof window === "undefined") return;

    const rect = buttonRef.current.getBoundingClientRect();
    const maxMenuHeight = 256;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < maxMenuHeight + gap && rect.top > spaceBelow;

    const style = {
      position: "fixed",
      left: `${Math.max(12, Math.min(rect.left, window.innerWidth - rect.width - 12))}px`,
      width: `${rect.width}px`,
      zIndex: 9999,
    };

    if (openUp) {
      style.bottom = `${Math.max(12, window.innerHeight - rect.top + gap)}px`;
    } else {
      style.top = `${Math.min(rect.bottom + gap, window.innerHeight - 80)}px`;
    }

    setDropdownStyle(style);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedTrigger = containerRef.current && containerRef.current.contains(e.target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!clickedTrigger && !clickedDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  const selectedOption = options.find(opt => opt.value === value) || null;
  const dropdown = typeof document !== "undefined" ? createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          style={dropdownStyle || { position: "fixed", visibility: "hidden" }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-2 max-h-64 overflow-y-auto no-scrollbar">
            {options.map((option, idx) => (
              <motion.button
                key={option.value}
                type="button"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  value === option.value
                    ? "bg-brandA text-white shadow-lg shadow-brandA/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && <FiCheck className="w-4 h-4" />}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <div className={`space-y-2 w-full ${isOpen ? "relative z-[1000]" : "relative z-0"} ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (!isOpen) updateDropdownPosition();
            setIsOpen(!isOpen);
          }}
          className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:border-brandA/50 transition-all group ${isOpen ? 'ring-4 ring-brandA/10 border-brandA/50 shadow-lg' : ''}`}
        >
          <span className={`text-[13px] font-black tracking-tight ${selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-brandA transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdown}
      </div>
    </div>
  );
}
