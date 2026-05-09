"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { motion } from "framer-motion";

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
    return <div className="w-full min-h-screen overflow-x-hidden">{children}</div>;
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-300 ${isSidebarOpen ? "md:ml-64 md:w-[calc(100%-16rem)]" : "md:ml-20 md:w-[calc(100%-5rem)]"} ml-0 p-4 md:p-8 pt-16 md:pt-8`}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full min-w-0"
      >
        {children}
      </motion.div>
    </div>
  );
}
