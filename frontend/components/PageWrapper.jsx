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

  if (!isLoggedIn) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <div className={`transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-20"} ml-0 p-4 md:p-8 pt-16 md:pt-8`}>
      {children}
    </div>
  );
}
