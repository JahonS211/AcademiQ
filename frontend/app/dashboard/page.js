"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { FiCamera, FiEdit3, FiPieChart, FiTool } from "react-icons/fi";

export default function DashboardPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [profile, setProfile] = useState(null);
  const [newName, setNewName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("https://academiq-api-hsvi.onrender.com/api/auth/profile", {
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

      await axios.post("https://academiq-api-hsvi.onrender.com/api/auth/profile", formData, {
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

  if (!ready || !profile) return null;

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `https://academiq-api-hsvi.onrender.com${normalizedPath}`;
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-brandA/20 shadow-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {profile.profilePhoto ? (
                <>
                  <img 
                    src={getPhotoUrl(profile.profilePhoto)} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full hidden items-center justify-center text-3xl font-bold text-brandA">
                    {profile.email[0].toUpperCase()}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-brandA">
                  {profile.email[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
          
          <h2 className="text-xl font-black mb-1">{profile.name || "Foydalanuvchi"}</h2>
          <p className="text-sm text-slate-500 mb-4 truncate w-full px-2">{profile.email}</p>
          
          <div className="px-4 py-1.5 bg-brandA/10 text-brandA rounded-full text-[10px] font-black uppercase tracking-widest">
            {(profile.planType || "free").replace("_", "+ ")} Plan
          </div>
        </div>

        {/* Edit Profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl">
            <h3 className="text-xl font-black mb-6 tracking-tighter uppercase">{t("profileSettings")}</h3>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("fullName")}</label>
                  <input 
                    className="input py-3 px-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 ring-brandA/20 font-bold text-sm" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder={t("topicPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("profilePhoto")}</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="profile-upload"
                      className="hidden" 
                      onChange={e => setPhoto(e.target.files[0])}
                      accept="image/*"
                    />
                    <label 
                      htmlFor="profile-upload"
                      className="flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:border-brandA hover:bg-brandA/5 transition-all text-sm"
                    >
                      <span className="text-lg text-indigo-500"><FiCamera /></span>
                      <span className="font-bold text-slate-500 truncate">
                        {photo ? photo.name : t("choosePhoto")}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary px-10 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-brandA/20 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? t("loading") : t("saveChanges")}
              </button>
            </form>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
              <div className="text-xl mb-1 text-blue-500"><FiEdit3 /></div>
              <div className="text-2xl font-black">{profile.stats.essays}</div>
              <div className="text-[9px] text-slate-500 font-black uppercase mt-1">{t("essaysWritten")}</div>
            </div>
            <div className="card p-4 bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
              <div className="text-xl mb-1 text-purple-500"><FiPieChart /></div>
              <div className="text-2xl font-black">{profile.stats.presentations}</div>
              <div className="text-[9px] text-slate-500 font-black uppercase mt-1">{t("presentationsCreated")}</div>
            </div>
            <div className="card p-4 bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
              <div className="text-xl mb-1 text-orange-500"><FiTool /></div>
              <div className="text-2xl font-black">{profile.stats.tools}</div>
              <div className="text-[9px] text-slate-500 font-black uppercase mt-1">{t("toolsUsed")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
