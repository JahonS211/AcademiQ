"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "../../../lib/api";
import { useI18n } from "../../../lib/i18n";

export default function AdminLoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.adminLogin(form);
      localStorage.setItem("adminToken", data.adminToken);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      toast.success(t("adminLoginSuccess"));
      router.push("/admin/panel");
    } catch (error) {
      toast.error(error.response?.data?.message || t("adminLoginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md card">
      <h2 className="text-2xl font-semibold">{t("adminLogin")}</h2>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder={t("adminEmail")}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input"
          placeholder={t("adminPassword")}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? t("loading") : t("adminLogin")}
        </button>
      </form>
    </div>
  );
}
