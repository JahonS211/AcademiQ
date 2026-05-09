"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";
import { FiCamera, FiEdit3, FiPieChart, FiTool, FiZap, FiStar, FiTrendingUp, FiLayout, FiClock, FiUser, FiLock } from "react-icons/fi";

export default function DashboardPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [profile, setProfile] = useState(null);
  const [newName, setNewName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(data.user);
      setNewName(data.user.name || "");
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      toast.error(t("processFailed"));
    }
  };

  useEffect(() => {
    if (ready) fetchProfile();
  }, [ready]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", newName);
      if (photo) formData.append("photo", photo);

      await axios.post("http://localhost:5000/api/auth/profile", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success(t("registerSuccess"));
      await fetchProfile();
    } catch (err) {
      toast.error(t("processFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/auth/change-password", {
        currentPassword, newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setPwdLoading(false);
    }
  };

  if (!ready || !profile) return null;

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `http://localhost:5000${normalizedPath}`;
  };

  const chartData = [
    { name: t("essays") || "Essays", value: profile.stats.essays || 0, color: "#6366f1" },
    { name: t("presentations") || "Slides", value: profile.stats.presentations || 0, color: "#a855f7" },
    { name: t("tools") || "Tools", value: profile.totalCreditsUsed || 0, color: "#f59e0b" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Upgrade Banner for Free Users */}
      {profile.planType === "free" && (
        <div className="relative overflow-hidden p-8 rounded-[2rem] bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-2xl border border-slate-800 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-indigo-500/20 transition-all duration-700" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                <FiZap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Upgrade Required</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">Unlock All AI Tools</h2>
              <p className="text-slate-400 font-medium text-sm max-w-md">Upgrade to PRO plan to access Presentations, Tests, AI Chat and much more.</p>
            </div>
            <button 
              onClick={() => window.location.href = "/pricing"}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shrink-0"
            >
              <FiStar className="text-amber-400" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Profile & Settings */}
        <div className="lg:col-span-4 space-y-8">
          {/* Profile Card */}
          <div className="card p-8 flex flex-col items-center text-center bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem]">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-3xl rotate-3 overflow-hidden border-4 border-brandA/20 shadow-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {profile.profilePhoto ? (
                  <img src={getPhotoUrl(profile.profilePhoto)} alt="Profile" className="w-full h-full object-cover -rotate-3" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-brandA -rotate-3">
                    {profile.email[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                <FiUser className="w-5 h-5" />
              </div>
            </div>
            
            <h2 className="text-2xl font-black mb-1 tracking-tight text-slate-800 dark:text-white">{profile.name || "Foydalanuvchi"}</h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">{profile.email}</p>
            
            <div className="flex items-center gap-2 px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
               <FiZap className="w-4 h-4 text-brandA" />
               <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                  {(profile.planType || "free").replace("_", "+ ")} Plan
               </span>
            </div>
          </div>

          {/* Mini Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 mb-2">Credits</p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{profile.credits}</span>
                <FiZap className="w-4 h-4 text-indigo-400 mb-1" />
              </div>
            </div>
            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-2">Used</p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{profile.totalCreditsUsed || 0}</span>
                <FiTrendingUp className="w-4 h-4 text-emerald-400 mb-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Charts & Detailed Stats */}
        <div className="lg:col-span-8 space-y-8">
          {/* Chart Section */}
          <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black tracking-tight uppercase">Usage Analytics</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Activity per tool type</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <FiPieChart className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }} 
                    dy={15}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{payload[0].name}</p>
                            <p className="text-xl font-black">{payload[0].value} Times</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem] flex items-center gap-6 group hover:shadow-2xl transition-all">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-600 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                <FiEdit3 />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Essays Generated</h4>
                <div className="text-3xl font-black text-slate-800 dark:text-white leading-none">{profile.stats.essays}</div>
              </div>
            </div>
            <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem] flex items-center gap-6 group hover:shadow-2xl transition-all">
              <div className="w-16 h-16 bg-purple-500/10 text-purple-600 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                <FiLayout />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Slides Created</h4>
                <div className="text-3xl font-black text-slate-800 dark:text-white leading-none">{profile.stats.presentations}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Settings Section */}
      <div className="grid lg:grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
        {/* Settings Form */}
        <div className="card p-10 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[3rem]">
          <h3 className="text-2xl font-black mb-8 tracking-tight uppercase flex items-center gap-4">
            <span className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20"><FiClock className="w-5 h-5" /></span>
            {t("profileSettings")}
          </h3>
          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{t("fullName")}</label>
                <input 
                  className="w-full py-5 px-7 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-bold text-sm shadow-inner" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder={t("topicPlaceholder")}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{t("profilePhoto")}</label>
                <div className="relative group">
                  <input type="file" id="profile-upload" className="hidden" onChange={e => setPhoto(e.target.files[0])} accept="image/*" />
                  <label htmlFor="profile-upload" className="flex items-center justify-between px-7 py-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5 transition-all">
                    <div className="flex items-center gap-4">
                      <FiCamera className="text-2xl text-indigo-500" />
                      <span className="font-bold text-slate-500 text-sm truncate max-w-[200px]">
                        {photo ? photo.name : t("choosePhoto")}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Browse</span>
                  </label>
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
              {loading ? t("loading") : t("saveChanges")}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="card p-10 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[3rem]">
          <h3 className="text-2xl font-black mb-8 tracking-tight uppercase flex items-center gap-4">
            <span className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl"><FiLock className="w-5 h-5" /></span>
            Security Settings
          </h3>
          {!profile.hasPassword ? (
            <div className="p-8 rounded-[2rem] bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-sm leading-relaxed">
              Siz tizimga Google orqali kirdingiz. Parolingiz mavjud emas. Xavfsizlikni oshirish uchun Google hisobingizdan foydalaning.
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Joriy parol</label>
                  <input type="password" required className="w-full py-5 px-7 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/30 transition-all outline-none font-bold text-sm shadow-inner" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Yangi parol</label>
                  <input type="password" required className="w-full py-5 px-7 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/30 transition-all outline-none font-bold text-sm shadow-inner" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={pwdLoading} className="w-full py-5 rounded-3xl bg-indigo-600 text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                {pwdLoading ? t("loading") : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
