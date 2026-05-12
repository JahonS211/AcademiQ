"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { FiBookOpen, FiCheckCircle, FiShield, FiZap } from "react-icons/fi";

const highlights = [
  { icon: FiZap, title: "Tez javob", text: "Insho, tarjima va o'quv vositalari bir joyda." },
  { icon: FiShield, title: "Xavfsiz kirish", text: "Akkauntingiz va kreditlaringiz himoyalangan." },
  { icon: FiBookOpen, title: "O'qishga mos", text: "Talabalar uchun sodda va aniq AI yordamchi." },
];

export default function AuthLayout({ children }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f8ff] px-4 pb-8 pt-24 text-slate-950 dark:bg-[#050b1d] dark:text-white md:px-8 md:pb-12">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-80">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.22),transparent_34%),radial-gradient(circle_at_80%_4%,rgba(20,184,166,0.16),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:44px_44px] dark:bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
      </div>

      <section className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        <motion.aside
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="hidden overflow-hidden rounded-[36px] border border-white/70 bg-white/75 p-8 shadow-2xl shadow-indigo-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/30 lg:block"
        >
          <div className="mb-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <FiBookOpen size={26} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.34em] text-indigo-500 dark:text-indigo-300">AcademiQ</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">Aql bilan o'qing</h2>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl dark:border-white/10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Bugungi ishlar</p>
                <h3 className="mt-2 text-2xl font-black">AI o'quv paneli</h3>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Online</span>
            </div>
            <div className="grid gap-3">
              {["Insho reja tayyorlandi", "Matn tarjima qilindi", "Test savollari yaratildi"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <FiCheckCircle className="text-emerald-300" />
                  <span className="text-sm font-bold text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 grid gap-4">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.aside>
      </section>
    </main>
  );
}
