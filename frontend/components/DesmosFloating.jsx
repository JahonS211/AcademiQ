"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FiExternalLink, FiX } from "react-icons/fi";
import DesmosPanel from "./DesmosPanel";
import { useI18n } from "../lib/i18n";

const DESMOS_PIN_KEY = "desmos-mini-pinned";

const copyMap = {
  uz: { mini: "Desmos mini", expand: "Katta ochish", close: "Yopish" },
  ru: { mini: "Мини Desmos", expand: "Открыть полностью", close: "Закрыть" },
  en: { mini: "Desmos mini", expand: "Open full", close: "Close" },
};

export default function DesmosFloating() {
  const pathname = usePathname();
  const { lang } = useI18n();
  const copy = copyMap[lang] || copyMap.en;
  const [loggedIn, setLoggedIn] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const syncPinned = () => {
      setLoggedIn(Boolean(localStorage.getItem("token")));
      setPinned(localStorage.getItem(DESMOS_PIN_KEY) === "1");
    };

    syncPinned();
    window.addEventListener("storage", syncPinned);
    window.addEventListener("desmos-mini-pin", syncPinned);
    return () => {
      window.removeEventListener("storage", syncPinned);
      window.removeEventListener("desmos-mini-pin", syncPinned);
    };
  }, [pathname]);

  const closeMini = () => {
    localStorage.setItem(DESMOS_PIN_KEY, "0");
    setPinned(false);
    window.dispatchEvent(new Event("desmos-mini-pin"));
  };

  if (!loggedIn || !pinned || pathname === "/desmos" || pathname === "/login" || pathname === "/register" || pathname === "/") {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-[70] w-[min(92vw,420px)] md:bottom-6">
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{copy.mini}</p>
          <div className="flex items-center gap-2">
            <Link href="/desmos" className="rounded-xl bg-indigo-500/10 p-2 text-indigo-500" title={copy.expand}>
              <FiExternalLink />
            </Link>
            <button onClick={closeMini} className="rounded-xl bg-slate-100 p-2 text-slate-500 dark:bg-slate-800" title={copy.close}>
              <FiX />
            </button>
          </div>
        </div>
        <DesmosPanel className="h-[320px]" />
      </div>
    </div>
  );
}
