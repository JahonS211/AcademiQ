"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiBookOpen, FiCheckCircle, FiEdit3, FiFileText, FiGlobe, FiLayers, FiPieChart, FiShield, FiZap } from "react-icons/fi";
import PathMorphing from "../components/PathMorphing";
import { HexagonBackground } from "../components/HexagonBackground";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const tools = [
  { title: "Insho Generator", desc: "Mavzu, til va uzunlikni tanlang. Kirish, asosiy qism va xulosa bilan tayyor matn oling.", icon: FiEdit3, tone: "text-indigo-500 bg-indigo-500/10" },
  { title: "Tarjimon", desc: "O'zbekcha, ruscha va inglizcha matnlarni kredit yechmasdan tarjima qiling.", icon: FiGlobe, tone: "text-cyan-500 bg-cyan-500/10" },
  { title: "Prezentatsiya", desc: "Pro tariflarda mavzuga mos slayd, dizayn va rasmlar bilan taqdimot tayyorlanadi.", icon: FiPieChart, tone: "text-violet-500 bg-violet-500/10" },
  { title: "Test va Flashcard", desc: "Savollar soni yoki kartalar sonini tanlab, mavzuni mustahkamlash uchun material yarating.", icon: FiLayers, tone: "text-emerald-500 bg-emerald-500/10" },
  { title: "AI Detector", desc: "Matn uslubi, takrorlanish va aniqlik bo'yicha AI ehtimolini sabablar bilan ko'rsatadi.", icon: FiShield, tone: "text-blue-500 bg-blue-500/10" },
  { title: "Fayl asboblari", desc: "Rasmni PDFga aylantirish, rasm matnini olish, konvertor va ZIP arxivator.", icon: FiFileText, tone: "text-rose-500 bg-rose-500/10" },
];

const steps = [
  "Mavzuni yoki matnni kiriting",
  "Til, uzunlik, slayd yoki savollar sonini tanlang",
  "Thinky natijani toza formatda tayyorlaydi",
  "Natijani nusxalang, yuklab oling yoki davom ettiring",
];

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <HexagonBackground />

      <section className="relative min-h-[92vh] overflow-hidden border-b border-slate-200/70 bg-[linear-gradient(135deg,#eef4ff_0%,#f8fbff_45%,#f5f0ff_100%)] pt-28 dark:border-slate-800 dark:bg-[linear-gradient(135deg,#07111f_0%,#0b1020_48%,#180f2d_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.08)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto flex min-h-[calc(92vh-7rem)] max-w-7xl flex-col justify-center px-6 pb-16"
        >
          <div className="max-w-3xl">
            <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-3 rounded-full border border-indigo-500/20 bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-indigo-600 shadow-sm backdrop-blur dark:bg-slate-900/60 dark:text-indigo-300">
              <FiZap className="h-4 w-4" />
              Thinky AI Education Platform
            </motion.div>

            <motion.h1 variants={fadeUp} className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-slate-950 dark:text-white md:text-7xl lg:text-8xl">
              Aql bilan o'qing. Natijani tezroq oling.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-7 max-w-2xl text-base font-semibold leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
              Thinky insho yozish, tarjima qilish, test tuzish, prezentatsiya tayyorlash va fayl ishlari uchun yagona AI platforma. Free tarifda insho va tarjimon, Pro tariflarda esa to'liq o'quv asboblari ishlaydi.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-slate-950 px-7 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-slate-950/20 transition-transform hover:scale-[1.02] active:scale-95 dark:bg-white dark:text-slate-950">
                Boshlash <FiArrowRight />
              </Link>
              <Link href="/pricing" className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-7 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-indigo-500/40 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
                Tariflarni ko'rish
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 80, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="pointer-events-none absolute bottom-[-70px] right-[-40px] hidden w-[620px] rounded-[2rem] border border-white/50 bg-slate-950 p-4 shadow-[0_40px_100px_rgba(15,23,42,0.35)] dark:border-white/10 lg:block"
          >
            <div className="rounded-[1.5rem] bg-[#07111f] p-5 text-white">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/logo-v2.png" alt="Thinky" className="h-10 w-10 rounded-full bg-white object-contain" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide">Thinky Dashboard</p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">AI models ready</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">Active</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Insho", "17 kredit", "bg-indigo-500"],
                  ["Tarjimon", "Bepul", "bg-cyan-500"],
                  ["Test", "9 kredit", "bg-emerald-500"],
                ].map(([name, cost, color]) => (
                  <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className={`mb-4 block h-2 w-10 rounded-full ${color}`} />
                    <p className="text-xs font-black uppercase">{name}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-400">{cost}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">AI javob</p>
                  <FiBookOpen className="text-indigo-300" />
                </div>
                <div className="space-y-2">
                  <span className="block h-3 w-full rounded bg-white/10" />
                  <span className="block h-3 w-10/12 rounded bg-white/10" />
                  <span className="block h-3 w-7/12 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section id="features" className="relative border-b border-slate-200/70 bg-white py-20 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="mb-12 max-w-3xl">
            <motion.p variants={fadeUp} className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-500">Platforma imkoniyatlari</motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">O'qish uchun kerakli asboblar bir joyda</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">Har bir bo'lim aniq vazifa uchun qurilgan: matn yozish, tarjima, tekshirish, slayd, test va fayl ishlarini alohida ochib yurmasdan bajarish mumkin.</motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div key={tool.title} variants={fadeUp} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-sm transition-transform hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${tool.tone}`}>
                    <Icon />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-wide text-slate-950 dark:text-white">{tool.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">{tool.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 dark:bg-[#07111f]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-500">Qanday ishlaydi</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Oddiy, tez va tartibli jarayon</h2>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">Thinky foydalanuvchini ortiqcha sozlamalar bilan charchatmaydi. Siz mavzu yoki matnni berasiz, platforma esa natijani o'qishga qulay formatda chiqaradi.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <motion.div key={step} variants={fadeUp} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-3xl font-black text-indigo-500/30">0{index + 1}</span>
                <p className="mt-4 text-sm font-black uppercase leading-relaxed tracking-wide text-slate-800 dark:text-slate-100">{step}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 py-16 text-white dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-300">Thinky</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-5xl">Bugun insho va tarjimadan boshlang, kerak bo'lsa Pro bilan kengaytiring.</h2>
          </div>
          <Link href="/register" className="inline-flex min-h-[58px] shrink-0 items-center justify-center gap-3 rounded-2xl bg-white px-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 shadow-xl transition-transform hover:scale-[1.02] active:scale-95">
            Akkaunt yaratish <FiCheckCircle />
          </Link>
        </div>
      </section>
    </div>
  );
}