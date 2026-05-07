"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { authApi } from "../../../lib/api";
import { useI18n } from "../../../lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error("Parollar mos kelmadi!");
    }
    setLoading(true);
    try {
      const { data } = await authApi.register({ email: form.email, password: form.password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(t("registerSuccess"));
      router.push("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || t("registerFailed"));
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
          isAccessToken: true
        });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success(t("registerSuccess"));
        router.push("/dashboard");
      } catch (err) {
        toast.error("Google Login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google Login failed"),
  });

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black mb-1 tracking-tightest uppercase">{t("register")}</h2>
        <p className="text-xs text-slate-500 font-bold opacity-70">{t("welcome")}</p>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
          <input 
            className="input py-3 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 ring-brandA/20 text-sm font-bold" 
            placeholder="example@gmail.com" 
            type="email" 
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
            required 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{t("password")}</label>
          <input 
            className="input py-3 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 ring-brandA/20 text-sm font-bold" 
            placeholder="••••••••" 
            type="password" 
            value={form.password} 
            onChange={(e) => setForm({ ...form, password: e.target.value })} 
            required 
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Confirm Password</label>
          <input 
            className="input py-3.5 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 ring-brandA/20 text-sm font-bold" 
            placeholder="••••••••" 
            type="password" 
            value={form.confirmPassword} 
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} 
            required 
          />
        </div>
        
        <button 
          className="btn-primary w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brandA/20 transition-all hover:scale-[1.02] mt-2" 
          disabled={loading}
        >
          {loading ? t("loading") : t("register") + " ✨"}
        </button>
      </form>
      
      <div className="mt-6 relative flex items-center justify-center">
        <div className="border-t border-slate-100 dark:border-slate-800 w-full absolute"></div>
        <span className="bg-white dark:bg-slate-950 px-6 text-[10px] font-black text-slate-300 relative z-10 uppercase tracking-[0.3em]">OR</span>
      </div>

      <div className="mt-5 flex flex-col items-center gap-4">
        <button 
          onClick={() => googleLogin()}
          type="button"
          className="w-full py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 hover:bg-slate-50 transition-all shadow-sm group"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">Continue with Google</span>
        </button>

        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
          {t("currentPlan")}?{" "}
          <Link href="/login" className="text-brandA hover:underline decoration-2 underline-offset-4 ml-2">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
