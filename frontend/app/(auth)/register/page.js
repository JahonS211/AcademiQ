"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FiArrowRight, FiCheckCircle, FiLock, FiMail } from "react-icons/fi";
import { authApi } from "../../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const saveSession = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    toast.success("Akkaunt yaratildi!");
    router.push("/dashboard");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Parollar mos emas");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.register({ email: form.email, password: form.password });
      saveSession(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const { data } = await authApi.googleLogin({
          token: tokenResponse.access_token,
          isAccessToken: true,
        });
        saveSession(data);
      } catch (_) {
        toast.error("Google orqali ro'yxatdan o'tishda xatolik");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google orqali ro'yxatdan o'tishda xatolik"),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto w-full max-w-md"
    >
      <div className="rounded-[34px] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-indigo-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.07] dark:shadow-black/30 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-white/90">
            <Image src="/logo.png" alt="AcademiQ" width={44} height={44} className="rounded-xl" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-300">Boshlash</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Ro'yxatdan o'tish</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">Free tarifda Insho Generator va Tarjimon bilan boshlang.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-400">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 transition focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus-within:bg-slate-950">
              <FiMail className="text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
                placeholder="email@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-400">Parol</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 transition focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus-within:bg-slate-950">
              <FiLock className="text-slate-400" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
                placeholder="Kamida 6 ta belgi"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-400">Parolni tasdiqlash</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 transition focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus-within:bg-slate-950">
              <FiCheckCircle className="text-slate-400" />
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
                placeholder="Parolni qayta kiriting"
              />
            </div>
          </label>

          <button
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Yaratilmoqda..." : "Akkaunt yaratish"}
            <FiArrowRight className="transition group-hover:translate-x-1" />
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          yoki
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <button
          onClick={() => googleLogin()}
          type="button"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-white"
        >
          <FcGoogle size={21} />
          Google orqali davom etish
        </button>

        <p className="mt-7 text-center text-sm font-semibold text-slate-500 dark:text-slate-300">
          Akkauntingiz bormi?{" "}
          <Link href="/login" className="font-black text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
            Kirish
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
