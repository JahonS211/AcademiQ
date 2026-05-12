"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "../lib/i18n";
import { FiArrowRight } from "react-icons/fi";

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [token, setToken] = useState(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setMounted(true);
  }, [pathname]);

  if (!mounted) return null; // Avoid hydration mismatch
  
  // Faqat ochiq sahifalarda Navbar ni ko'rsatish
  const publicPaths = ["/", "/login", "/register", "/pricing", "/donat"];
  if (!publicPaths.includes(pathname)) return null;

  if (token) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 select-none group">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
            <img 
              src="/logo-v2.png" 
              alt="Thinky" 
              className="relative w-8 h-8 rounded-full object-contain bg-white shadow-sm" 
            />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{t("home") || "Thinky"}</span>
        </Link>
        
        {/* Center: Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">{t("home")}</Link>
          <Link href="/donat" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">Donat</Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher direction="down" />
          <ThemeToggle />
          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />
          
          <Link href="/login" className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors">
            {t("login")}
          </Link>
          <Link href="/register" className="flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-indigo-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors">
            <span className="hidden sm:inline">{t("register")}</span>
            <span className="sm:hidden">Start</span>
            <FiArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
