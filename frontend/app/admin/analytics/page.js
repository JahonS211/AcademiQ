"use client";

import { API_BASE_URL } from "../../../lib/config";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
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
import { 
  FiHome, FiUsers, FiCreditCard, FiZap, FiGift, FiRotateCcw, FiClock, FiDollarSign, FiSearch, FiExternalLink, FiBarChart2, FiCheckCircle
} from "react-icons/fi";

const baseURL = `${API_BASE_URL}`;

function Card({ title, value, sub, icon }) {
  return (
    <div className="rounded-3xl border border-slate-100/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-6 shadow-xl shadow-black/5 group hover:scale-[1.02] transition-transform">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-brandA group-hover:bg-brandA/10 transition-colors">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">{sub}</p>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [adminToken, setAdminToken] = useState("");
  const [overview, setOverview] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [payments, setPayments] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("payments");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setAdminToken(token);
  }, [router]);

  const fetchData = async () => {
    if (!adminToken) return;
    const headers = { Authorization: `Bearer ${adminToken}` };
    setLoading(true);
    try {
      const [o, g, p, h] = await Promise.all([
        axios.get(`${baseURL}/api/admin/analytics/overview`, { headers }),
        axios.get(`${baseURL}/api/admin/analytics/growth?days=30`, { headers }),
        axios.get(`${baseURL}/api/admin/analytics/payments`, { headers }),
        axios.get(`${baseURL}/api/admin/analytics/detailed-history`, { headers }),
      ]);
      setOverview(o.data);
      setGrowth(g.data);
      setPayments(p.data);
      setHistory(h.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminToken]);

  const handleReset = async () => {
    if (!window.confirm("Barcha analitika va tarixni tozalashga ishonchingiz komilmi? Bu amalni orqaga qaytarib bo'lmaydi!")) return;
    
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      await axios.post(`${baseURL}/api/admin/analytics/reset`, {}, { headers });
      toast.success("Analitika muvaffaqiyatli tozalandi");
      fetchData();
    } catch (e) {
      toast.error("Tozalashda xatolik yuz berdi");
    }
  };

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
    <div className="max-w-7xl mx-auto py-8 space-y-6 px-4">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brandA/10 text-brandA rounded-full border border-brandA/20 mb-3">
             <FiBarChart2 className="w-3 h-3" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dashboard Control</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">Admin Analytics</h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm font-medium mt-3">
            Real-vaqt rejimida o'sish, daromad va faollik tahlili.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            aria-label="Analitikani yangilash"
            onClick={fetchData}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-brandA transition-colors shadow-lg"
          >
            <FiRotateCcw className={loading ? "animate-spin" : ""} />
          </button>
          
          <button 
            aria-label="Analitikani tozalash"
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-transform duration-150"
          >
            <FiRotateCcw className="w-4 h-4" />
            Tozalash
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Jami foydalanuvchilar" value={overview?.totalUsers ?? (loading ? "—" : 0)} icon={<FiUsers />} sub="Platforma a'zolari" />
        <Card title="Faol foydalanuvchilar" value={overview?.activeUsers ?? (loading ? "—" : 0)} icon={<FiClock />} sub="Oxirgi 7 kun" />
        <Card title="Jami Daromad" value={overview ? overview.revenue.toLocaleString() : (loading ? "—" : "0")} sub="O'zbek so'mi (UZS)" icon={<FiDollarSign />} />
        <Card title="To'lovlar soni" value={overview?.payments ?? (loading ? "—" : 0)} icon={<FiCreditCard />} sub="Muvaffaqiyatli tranzaksiyalar" />
        <Card title="Ishlatilgan kreditlar" value={overview?.creditsUsed ?? (loading ? "—" : 0)} icon={<FiZap />} sub="AI amallari bo'yicha" />
        <Card title="Berilgan mukofotlar" value={overview?.rewardsEarned ?? (loading ? "—" : 0)} icon={<FiGift />} sub="Reward tizimi orqali" />
        <Card title="Referral jami" value={overview?.referralTotal ?? (loading ? "—" : 0)} icon={<FiUsers />} sub="Taklif qilinganlar" />
        <Card title="Referral to'lovlar" value={overview?.referralPaid ?? (loading ? "—" : 0)} icon={<FiCheckCircle />} sub="Tasdiqlangan to'lovlar" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">User growth (30d)</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usersSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} 
                />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Revenue growth (30d)</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} 
                />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed History Table */}
      <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Detailed Transaction History</h3>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-1">
             {["payments", "credits", "rewards"].map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-150 ${
                   activeTab === tab 
                     ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg" 
                     : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                 }`}
               >
                 {tab === "payments" ? "To'lovlar" : tab === "credits" ? "Kreditlar" : "Mukofotlar"}
               </button>
             ))}
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action/Plan</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount/Cost</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {activeTab === "payments" && history?.payments.map((p, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.userId?.name || "Unknown"}</span>
                      <span className="text-[10px] text-slate-500">{p.userId?.email}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/10">
                      {p.plan}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{p.amount.toLocaleString()} UZS</span>
                  </td>
                  <td className="py-4">
                    <span className="text-[10px] font-bold text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}

              {activeTab === "credits" && history?.credits.map((c, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.userId?.name || "Unknown"}</span>
                      <span className="text-[10px] text-slate-500">{c.userId?.email}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest">{c.toolName}</span>
                      <span className="text-[9px] text-slate-500 italic truncate max-w-[150px]">{c.details}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-black text-brandA">-{c.creditsUsed} Credits</span>
                  </td>
                  <td className="py-4">
                    <span className="text-[10px] font-bold text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}

              {activeTab === "rewards" && history?.rewards.map((r, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.userId?.name || "Unknown"}</span>
                      <span className="text-[10px] text-slate-500">{r.userId?.email}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      r.type === "earn" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" : "bg-red-500/10 text-red-500 border-red-500/10"
                    }`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`text-xs font-black ${r.type === "earn" ? "text-emerald-500" : "text-red-500"}`}>
                      {r.type === "earn" ? "+" : "-"}{r.amount} Rewards
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-[10px] font-bold text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!history || (activeTab === "payments" && history.payments.length === 0)) && (
            <div className="text-center py-20 opacity-30">
               <FiClock className="mx-auto text-4xl mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest">Ma'lumot topilmadi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

