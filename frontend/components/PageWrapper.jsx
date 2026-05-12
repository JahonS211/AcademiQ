"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageWrapper({ children }) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) setIsSidebarOpen(saved === "true");

    const listener = () => {
      setIsSidebarOpen(localStorage.getItem("sidebarOpen") === "true");
    };
    window.addEventListener("sidebarToggle", listener);
    return () => window.removeEventListener("sidebarToggle", listener);
  }, [pathname]);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!isLoggedIn || isAuthPage) {
    return <div className="w-full min-h-screen overflow-x-hidden">{children}</div>;
  }

  const isChat = pathname === "/chat";
  const marginClass = isSidebarOpen ? "md:ml-64" : "md:ml-20";
  const shellClass = isChat
    ? `h-screen overflow-hidden ${marginClass} ml-0 p-3 md:p-6 pt-16 md:pt-6`
    : `min-h-screen overflow-x-hidden ${marginClass} ml-0 p-4 md:p-8 pt-16 md:pt-8`;

  return (
    <main className={shellClass}>
      <div className={isChat ? "w-full h-full min-h-0 min-w-0" : "w-full min-w-0"}>
        {children}
      </div>
    </main>
  );
}