"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "../lib/i18n";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationsDropdown from "./NotificationsDropdown";
import { 
  FiHome, FiEdit3, FiTool, FiPieChart, FiFileText, 
  FiGift, FiGlobe, FiMessageSquare, FiHeart, FiStar, 
  FiSettings, FiUsers, FiLogOut, FiClock, FiSidebar
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

  useEffect(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) setIsOpen(saved === "true");
  }, []);

  useEffect(() => {
    const syncUser = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) { setUser(JSON.parse(savedUser)); setImgErr(false); }
      setToken(localStorage.getItem("token"));
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, [pathname]);

  const toggleSidebar = () => {
    const next = !isOpen;
    setIsOpen(next);
    localStorage.setItem("sidebarOpen", next);
    window.dispatchEvent(new Event("sidebarToggle"));
  };

  const links = [
    { href: "/dashboard",       label: t("dashboard"),      icon: <FiHome className="w-5 h-5" /> },
    { href: "/essay-generator", label: t("essay"),           icon: <FiEdit3 className="w-5 h-5" /> },
    { href: "/tools",           label: t("tools"),           icon: <FiTool className="w-5 h-5" /> },
    { href: "/presentations",   label: t("presentations"),   icon: <FiPieChart className="w-5 h-5" /> },
    { href: "/tests",           label: t("tests"),           icon: <FiFileText className="w-5 h-5" /> },
    { href: "/translator",      label: "Tarjimon",           icon: <FiGlobe className="w-5 h-5" /> },
    { href: "/history",         label: "Tarix",              icon: <FiClock className="w-5 h-5" /> },
    { href: "/donat",           label: "Donat",              icon: <FiHeart className="w-5 h-5" /> },
    { href: "/pricing",         label: "Premium",            icon: <FiStar className="w-5 h-5" /> },
    { href: "/referrals",       label: "Referrals",          icon: <FiGift className="w-5 h-5" /> },
    { href: "/support",         label: "Yordam",             icon: <FiMessageSquare className="w-5 h-5" /> },
  ];
  
  const adminLinks = [
    { href: "/admin/panel", label: "Foydalanuvchilar", icon: <FiUsers className="w-5 h-5" /> },
    { href: "/admin/analytics", label: "Analitika", icon: <FiPieChart className="w-5 h-5" /> },
    { href: "/history", label: "Tarix", icon: <FiClock className="w-5 h-5" /> },
    { href: "/admin/settings", label: "Sozlamalar", icon: <FiSettings className="w-5 h-5" /> },
  ];

  const logout = () => {
    localStorage.clear();
    setToken(null); setUser(null);
    router.push("/");
    setTimeout(() => window.location.reload(), 100);
  };

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
    return `${base}${path.startsWith("/") ? path : '/' + path}`;
  };

  if (!user && !token) return null;

  const plan = user?.planType || "free";
  const planConf = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const photoUrl = user?.profilePhoto ? getPhotoUrl(user.profilePhoto) : null;
  const activeLinks = user?.role === "admin" ? adminLinks : links;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile Hamburger (when closed) */}
      {!isOpen && (
        <button 
          onClick={toggleSidebar} 
          className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
        >
          <FiSidebar className="w-5 h-5" />
        </button>
      )}

      <aside className={`fixed left-0 top-0 z-40 h-screen ${isOpen ? "w-[280px] md:w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"} border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out flex flex-col`}>

      {/* Logo */}
      <div className={`flex items-center ${isOpen ? "justify-between px-5" : "justify-center"} h-16 shrink-0 border-b border-slate-200 dark:border-slate-800`}>
        <div className="flex items-center gap-4 overflow-hidden">
          <div 
            className="relative w-10 h-10 shrink-0 flex items-center justify-center cursor-pointer group/logo" 
            onClick={!isOpen ? toggleSidebar : undefined}
          >
            <img 
              src="/logo.png" 
              alt="AcademiQ" 
              className={`w-8 h-8 rounded-full object-contain transition-opacity duration-200 ${!isOpen ? "group-hover/logo:opacity-0" : ""}`} 
            />
            {!isOpen && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity duration-200">
                 <FiSidebar className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
          
          {isOpen && (
            <span className="text-lg font-bold text-slate-800 dark:text-white whitespace-nowrap">
              AcademiQ
            </span>
          )}
        </div>
        {isOpen && (
           <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <FiSidebar className="w-5 h-5" />
           </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-6 space-y-2 px-3">
        {activeLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={`flex items-center gap-4 rounded-lg px-3 py-3 transition-colors duration-200 ${
                isActive
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <div className="shrink-0 flex items-center justify-center text-xl">
                {link.icon}
              </div>
              {isOpen && (
                <span className="font-medium text-sm whitespace-nowrap">
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className={`shrink-0 border-t border-slate-200 dark:border-slate-800 ${isOpen ? "p-3" : "py-3 px-2"} flex flex-col gap-3 relative z-50`}>
        {/* User Card */}
        <div className={`flex items-center gap-3 ${isOpen ? "px-2" : "justify-center"}`}>
           <div className={`relative shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 ${planConf.ring}`}>
              {photoUrl && !imgErr ? (
                <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${planConf.color} text-white font-bold text-sm`}>
                  {initials}
                </div>
              )}
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${planConf.color} bg-clip-text text-transparent`}>{planConf.label} PLAN</span>
              </div>
            )}
        </div>

        {/* Action Row */}
        {isOpen ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <NotificationsDropdown />
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-2 mt-1 text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/10 rounded-xl transition-colors font-bold text-sm">
              <FiLogOut className="w-4 h-4" />
              <span>{t("logout") || "Chiqish"}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 mt-2">
            <LanguageSwitcher compact />
            <NotificationsDropdown />
            <ThemeToggle />
            <button onClick={logout} className="text-slate-500 hover:text-red-500 transition-colors p-2">
               <FiLogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
