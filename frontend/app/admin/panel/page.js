"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../../lib/i18n";

export default function AdminPanelPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [adminToken, setAdminToken] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users"); // "users" or "content"

  // Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [blockingUser, setBlockingUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setAdminToken(token);
    fetchUsers(token);
  }, [router]);

  const fetchUsers = async (token) => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/admin/manage/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data.users);
    } catch (err) {
      toast.error("Foydalanuvchilarni yuklashda xatolik");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/admin/manage/users/${editingUser._id}`, editingUser, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success("Muvaffaqiyatli saqlandi");
      setEditingUser(null);
      fetchUsers(adminToken);
    } catch (err) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Haqiqatdan ham o'chirmoqchimisiz?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/manage/users/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success("O'chirildi");
      fetchUsers(adminToken);
    } catch (err) {
      toast.error("Xatolik");
    }
  };

  const handleBlockUser = async () => {
    try {
      await axios.post(`http://localhost:5000/api/admin/manage/users/${blockingUser._id}/block`, {
        isBlocked: true,
        blockedUntil: blockingUser.blockedUntil
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success("Bloklandi");
      setBlockingUser(null);
      fetchUsers(adminToken);
    } catch (err) {
      toast.error("Xatolik");
    }
  };

  const handleUnblock = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/manage/users/${id}/block`, {
        isBlocked: false
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success("Blokdan ochildi");
      fetchUsers(adminToken);
    } catch (err) {
      toast.error("Xatolik");
    }
  };

  if (!adminToken) return null;

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tightest uppercase gradient-text">Admin Panel</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-60">System Management Dashboard</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
          <button 
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white dark:bg-slate-800 shadow-sm text-brandA' : 'text-slate-500'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab("content")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-white dark:bg-slate-800 shadow-sm text-brandA' : 'text-slate-500'}`}
          >
            Content
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "users" ? (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-0 overflow-hidden border-none shadow-2xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Plan</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-brandA border border-slate-200 dark:border-slate-700">
                            {u.email[0].toUpperCase()}
                            {u.isOnline && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              {u.name || "No Name"}
                              {u.isOnline && <span className="text-[8px] uppercase tracking-widest text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Online</span>}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                            {!u.isOnline && u.lastSeenAt && (
                              <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Last seen: {new Date(u.lastSeenAt).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          u.planType === 'pro_plus' ? 'bg-purple-100 text-purple-600' : 
                          u.planType === 'pro' ? 'bg-blue-100 text-blue-600' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {u.planType.replace("_", "+ ")}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {u.isBlocked ? (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-red-500">Blocked</span>
                            <span className="text-[8px] text-slate-400">{u.blockedUntil ? new Date(u.blockedUntil).toLocaleDateString() : "Permanent"}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-green-500">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingUser(u)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all" title="Edit">✏️</button>
                          <button onClick={() => setBlockingUser(u)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all" title="Block">🚫</button>
                          {u.isBlocked && <button onClick={() => handleUnblock(u._id)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all" title="Unblock">🔓</button>}
                          <button onClick={() => handleDeleteUser(u._id)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition-all" title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-10 max-w-xl mx-auto"
          >
            <h2 className="text-xl font-black uppercase tracking-tightest mb-6">Upload Presentation</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const form = {
                  title: e.target.title.value,
                  category: e.target.category.value,
                  fileUrl: e.target.fileUrl.value
                };
                const { presentationApi } = await import("../../../lib/api");
                await presentationApi.adminUpload(form, adminToken);
                toast.success("Muvaffaqiyatli yuklandi");
                e.target.reset();
              } catch (err) {
                toast.error("Xatolik yuz berdi");
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <input name="title" className="input py-4" placeholder="Presentation Title" required />
              <input name="category" className="input py-4" placeholder="Category" required />
              <input name="fileUrl" className="input py-4" placeholder="File URL (https://...)" required />
              <button disabled={loading} className="btn-primary w-full py-4 text-[10px] font-black uppercase tracking-widest">
                {loading ? "Yuklanmoqda..." : "Upload Presentation ✨"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card w-full max-w-md p-8 bg-white dark:bg-slate-900"
          >
            <h2 className="text-xl font-black uppercase tracking-tightest mb-6">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                <input 
                  className="input py-3.5" 
                  value={editingUser.name} 
                  onChange={e => setEditingUser({...editingUser, name: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                <input 
                  className="input py-3.5" 
                  value={editingUser.email} 
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Type</label>
                <select 
                  className="input py-3.5"
                  value={editingUser.planType}
                  onChange={e => setEditingUser({...editingUser, planType: e.target.value})}
                >
                  <option value="free">FREE</option>
                  <option value="pro">PRO</option>
                  <option value="pro_plus">PRO+</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Block User Modal */}
      {blockingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card w-full max-w-md p-8 bg-white dark:bg-slate-900"
          >
            <h2 className="text-xl font-black uppercase tracking-tightest mb-2">Block User</h2>
            <p className="text-xs text-slate-500 mb-6 font-medium italic">Foydalanuvchini vaqtincha yoki butunlay bloklash.</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Until Date (Optional)</label>
                <input 
                  type="date"
                  className="input py-3.5" 
                  onChange={e => setBlockingUser({...blockingUser, blockedUntil: e.target.value})} 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setBlockingUser(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                <button onClick={handleBlockUser} className="flex-1 bg-rose-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20">Block User</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
