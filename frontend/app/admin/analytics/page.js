"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://academiq-api-hsvi.onrender.com";

function Card({ title, value, sub }) {
  return (
    <div className="rounded-3xl border border-slate-100/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-6 shadow-xl shadow-black/5">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className="text-3xl font-black tracking-tight mt-2">{value}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [adminToken, setAdminToken] = useState("");
  const [overview, setOverview] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setAdminToken(token);
  }, [router]);

  useEffect(() => {
    if (!adminToken) return;
    const headers = { Authorization: `Bearer ${adminToken}` };

    (async () => {
      setLoading(true);
      try {
        const [o, g, p] = await Promise.all([
          axios.get(`${baseURL}/api/admin/analytics/overview`, { headers }),
          axios.get(`${baseURL}/api/admin/analytics/growth?days=30`, { headers }),
          axios.get(`${baseURL}/api/admin/analytics/payments`, { headers }),
        ]);
        setOverview(o.data);
        setGrowth(g.data);
        setPayments(p.data);
      } catch (e) {
        toast.error(e.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, [adminToken]);

  const revenueSeries = useMemo(() => {
    const rows = growth?.revenueSeries || [];
    return rows.map((r) => ({ date: r._id, revenue: r.revenue, payments: r.payments }));
  }, [growth]);

  const usersSeries = useMemo(() => {
    const rows = growth?.usersSeries || [];
    return rows.map((r) => ({ date: r._id, users: r.count }));
  }, [growth]);

  const topPlans = useMemo(() => {
    const rows = payments?.topPlans || [];
    return rows.map((r) => ({ plan: r._id, revenue: r.revenue, count: r.count }));
  }, [payments]);

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">Admin Analytics</h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm font-medium mt-2">
            Real-time overview of growth, revenue and subscriptions.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
            loading ? "border-slate-200 dark:border-slate-800 text-slate-400" : "border-green-500/30 text-green-600 dark:text-green-400"
          }`}>
            {loading ? "Loading" : "Live"}
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Total users" value={overview?.totalUsers ?? (loading ? "—" : 0)} />
        <Card title="Active users (7d)" value={overview?.activeUsers ?? (loading ? "—" : 0)} />
        <Card title="Payments" value={overview?.payments ?? (loading ? "—" : 0)} />
        <Card title="Revenue" value={overview ? overview.revenue.toLocaleString() : (loading ? "—" : "0")} sub="UZS" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">User growth (30d)</p>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usersSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Revenue growth (30d)</p>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Most popular plans</p>
        </div>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPlans}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="plan" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

