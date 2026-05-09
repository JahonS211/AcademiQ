"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { FiSun, FiMoon } from "react-icons/fi"

export default function ThemeToggle() {
    const [dark, setDark] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        const shouldDark = saved === "dark";
        setDark(shouldDark);
        document.documentElement.classList.toggle("dark", shouldDark);
        setMounted(true);
    }, []);

    const toggleSwitch = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
    }

    if (!mounted) return <div className="w-[50px] h-[28px]" />

    return (
        <button
            className="flex items-center rounded-full p-1 cursor-pointer transition-colors w-[50px] h-[28px] border dark:border-slate-700 bg-slate-200 dark:bg-slate-800"
            style={{
                justifyContent: dark ? "flex-end" : "flex-start",
            }}
            onClick={toggleSwitch}
        >
            <motion.div
                className="w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                style={{ backgroundColor: dark ? "#3b82f6" : "#f59e0b" }}
                layout
                transition={{
                    type: "spring",
                    visualDuration: 0.2,
                    bounce: 0.2,
                }}
            >
                {dark ? <FiMoon className="w-3 h-3 text-white" /> : <FiSun className="w-3 h-3 text-white" />}
            </motion.div>
        </button>
    )
}
