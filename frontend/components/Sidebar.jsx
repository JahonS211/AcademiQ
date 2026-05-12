"use client";

import { API_BASE_URL } from "../lib/config";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "../lib/i18n";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationsDropdown from "./NotificationsDropdown";
import { 
  FiEdit3, FiPieChart, FiFileText, 
  FiGift, FiGlobe, FiMessageSquare, FiHeart, FiStar, 
  FiSettings, FiUsers, FiLogOut, FiClock, FiSidebar,
  FiChevronUp, FiChevronDown, FiCreditCard, FiUser, FiHelpCircle, FiZap, FiLock, FiBookOpen
} from "react-icons/fi";

const PLAN_CONFIG = {
  free:     { label: "FREE",    color: "from-slate-400 to-slate-500",    glow: "shadow-slate-400/30",  ring: "ring-slate-300" },
  pro:      { label: "PRO",     color: "from-blue-500 to-indigo-600",    glow: "shadow-blue-500/40",   ring: "ring-blue-400" },
  pro_plus: { label: "PRO+",   color: "from-violet-500 to-fuchsia-600", glow: "shadow-violet-500/50", ring: "ring-violet-400" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [imgErr, setImgErr] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [textScale, setTextScale] = useState(16);

  useEffect(() => {
    const savedScale = Number(localStorage.getItem("textScale") || 16);
    if (Number.isFinite(savedScale)) setTextScale(Math.min(20, Math.max(14, savedScale)));
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) setIsOpen(saved === "true");
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${textScale}px`;
    localStorage.setItem("textScale", String(textScale));
  }, [textScale]);

  useEffect(() => {
    const syncUser = async () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) { setUser(JSON.parse(savedUser)); setImgErr(false); }
      const token = localStorage.getItem("token");
      setToken(token);

      if (token) {
        try {
          const { data } = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (data && (data.success || data.user)) {
            const userData = data.user || data;
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
          }
        } catch (e) { console.error("Profile sync failed", e); }
      }
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("creditsUpdated", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("creditsUpdated", syncUser);
    };
  }, []);

  const toggleSidebar = () => {
    const next = !isOpen;
    setIsOpen(next);
    localStorage.setItem("sidebarOpen", next);
    requestAnimationFrame(() => window.dispatchEvent(new Event("sidebarToggle")));
  };

  const links = [
    { href: "/chat",            label: t("Chat") || "AI Chat",   icon: <FiMessageSquare className="w-5 h-5" />, allowedPlans: ["pro", "pro_plus"] },
    { href: "/essay-generator", label: t("essay"),           icon: <FiEdit3 className="w-5 h-5" />, allowedPlans: ["free", "pro", "pro_plus"] },
    { href: "/tools",           label: "AI Tools",           icon: <FiZap className="w-5 h-5" />,          allowedPlans: ["pro", "pro_plus"] },
    { href: "/presentations",   label: t("presentations"),   icon: <FiPieChart className="w-5 h-5" />, allowedPlans: ["pro", "pro_plus"] },
    { href: "/tests",           label: t("tests"),           icon: <FiFileText className="w-5 h-5" />, allowedPlans: ["pro", "pro_plus"] },
    { href: "/translator",      label: t("translator"),      icon: <FiGlobe className="w-5 h-5" />, allowedPlans: ["free", "pro", "pro_plus"] },
    { href: "/donat",           label: t("donat"),           icon: <FiHeart className="w-5 h-5" />, allowedPlans: ["free", "pro", "pro_plus"] },
    { href: "/referrals",       label: t("referrals"),       icon: <FiGift className="w-5 h-5" />, allowedPlans: ["free", "pro", "pro_plus"] },
    { href: "/support",         label: t("support"),         icon: <FiHelpCircle className="w-5 h-5" />, allowedPlans: ["free", "pro", "pro_plus"] },
  ];
  
  const adminLinks = [
    { href: "/admin/panel", label: t("users"), icon: <FiUsers className="w-5 h-5" />, allowedPlans: ["pro", "pro_plus"] },
    { href: "/admin/analytics", label: t("analytics"), icon: <FiPieChart className="w-5 h-5" />, allowedPlans: ["pro", "pro_plus"] },
    { href: "/history", label: t("history"), icon: <FiClock className="w-5 h-5" />, allowedPlans: ["pro", "pro_plus"] },
    { href: "/admin/settings", label: t("settings"), icon: <FiSettings className="w-5 h-5" />, allowedPlans: ["pro", "pro_plus"] },
  ];

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null); setUser(null);
    window.location.href = "/";
  };

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const base = `${API_BASE_URL}`;
    return `${base}${path.startsWith("/") ? path : '/' + path}`;
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";
  if ((!user && !token) || isAuthPage) return null;

  const plan = user?.planType || "free";
  const planConf = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const photoUrl = user?.profilePhoto ? getPhotoUrl(user.profilePhoto) : null;
  const activeLinks = user?.role === "admin" ? adminLinks : links;

  const handleLinkClick = (e, link) => {
    if (user?.role !== "admin" && !link.allowedPlans.includes(plan)) {
      e.preventDefault();
      router.push("/pricing");
      toast.error("Iltimos, ushbu xizmatdan foydalanish uchun tarifingizni yangilang.");
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile Hamburger */}
      {!isOpen && (
        <button 
          onClick={toggleSidebar} 
          className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
        >
          <FiSidebar className="w-5 h-5" />
        </button>
      )}

      <aside className={`fixed left-0 top-0 z-40 h-screen ${isOpen ? "w-[280px] md:w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"} border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-200 ease-out flex flex-col overflow-hidden`}>
        {/* Logo */}
        <div className={`flex items-center ${isOpen ? "justify-between px-5" : "justify-center"} h-16 shrink-0 border-b border-slate-200 dark:border-slate-800`}>
          <div className="flex items-center gap-4 overflow-hidden">
            <div 
              className="relative w-10 h-10 shrink-0 flex items-center justify-center cursor-pointer group/logo" 
              onClick={!isOpen ? toggleSidebar : undefined}
            >
              <img src="/logo.png" alt="AcademiQ" className="w-8 h-8 rounded-full object-contain" />
            </div>
            {isOpen && <span className="text-lg font-bold text-slate-800 dark:text-white whitespace-nowrap">AcademiQ</span>}
          </div>
          {isOpen && (
             <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <FiSidebar className="w-5 h-5" />
             </button>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-2 px-3">
          {activeLinks.map((link) => {
            const isActive = pathname === link.href;
            const isRestricted = user?.role !== "admin" && !link.allowedPlans.includes(plan);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  handleLinkClick(e, link);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className={`flex items-center gap-4 rounded-lg px-3 py-3 transition-colors relative group ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : isRestricted 
                      ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <div className="shrink-0 flex items-center justify-center text-xl">{link.icon}</div>
                {isOpen && <span className="font-medium text-sm whitespace-nowrap flex-1">{link.label}</span>}
                {isOpen && isRestricted && <FiLock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />}
              </Link>
            );
          })}
        </div>

        {/* Bottom Controls */}
        <div className={`shrink-0 border-t border-slate-200 dark:border-slate-800 ${isOpen ? "p-3" : "py-3 px-2"} flex flex-col gap-3`}>
          {isOpen && (
             <div className="space-y-2 px-2 mb-1">
               <div className="flex items-center justify-between">
                 <LanguageSwitcher />
                 <ThemeToggle />
               </div>
               <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 p-1">
                 <button onClick={() => setTextScale((v) => Math.max(14, v - 1))} className="flex-1 rounded-lg py-1.5 text-[10px] font-black">A-</button>
                 <span className="text-[10px] font-black text-slate-400">TEXT</span>
                 <button onClick={() => setTextScale((v) => Math.min(20, v + 1))} className="flex-1 rounded-lg py-1.5 text-sm font-black">A+</button>
               </div>
             </div>
          )}
          
          {/* Credits Bar */}
          {isOpen && user && (
            <div className="px-3 mb-2 space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("credits") || "Kreditlar"}</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">
                  <FiZap className="w-2.5 h-2.5" />
                  <span className="text-[10px] font-black">{user.credits ?? 0} {t("creditsLeft") || "Bor"}</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${Math.max(2, Math.min(100, ((user.credits || 0) / (plan === "free" ? 50 : plan === "pro" ? 150 : 500)) * 100))}%` }} 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" 
                />
              </div>
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase px-0.5">
                <span>0</span>
                <span>{plan === "free" ? 50 : plan === "pro" ? 150 : 500} MAX</span>
              </div>
            </div>
          )}

          {/* User Button */}
          <div className="relative">
            {isUserMenuOpen && isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-2 space-y-1">
                   <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"><FiUser /> Account</Link>
                   <Link href="/pricing" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"><FiStar /> Upgrade</Link>
                   <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 text-sm"><FiLogOut /> Log out</button>
                </div>
            )}
            <button 
              onClick={() => isOpen ? setIsUserMenuOpen(!isUserMenuOpen) : toggleSidebar()}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
            >
               <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${planConf.color} text-white font-bold text-xs`}>
                  {initials}
               </div>
               {isOpen && (
                 <div className="flex flex-col min-w-0 flex-1 text-left">
                   <span className="text-sm font-semibold truncate">{displayName}</span>
                   <span className="text-[10px] text-slate-500 truncate">{user?.email}</span>
                 </div>
               )}
               {isOpen && <FiChevronUp className={`w-4 h-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
