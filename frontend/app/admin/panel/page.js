"use client";

import { API_BASE_URL } from "../../../lib/config";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../../lib/i18n";
import { ManagementBar } from "../../../components/ManagementBar";
import { FiChevronDown, FiMessageSquare, FiPieChart, FiSend, FiZap, FiEdit2, FiSlash, FiUnlock, FiTrash2, FiUpload } from "react-icons/fi";
import Link from "next/link";

export default function AdminPanelPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [adminToken, setAdminToken] = useState("");
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [adminChatMessages, setAdminChatMessages] = useState([
    {
      role: "assistant",
      text: "AcademiQ admin assistant tayyor. Email yoki user ID bilan buyruq yozing: masalan, user@mail.com ga 50 credit qo'sh.",
    },
  ]);
  const [adminChatInput, setAdminChatInput] = useState("");
  const [adminChatLoading, setAdminChatLoading] = useState(false);

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
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/manage/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data.users);
    } catch (err) {
      toast.error(t("errorLoadingUsers") || "Foydalanuvchilarni yuklashda xatolik");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/admin/manage/users/${editingUser._id}`, editingUser, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(t("processSuccess"));
      setEditingUser(null);
      fetchUsers(adminToken);
    } catch (err) {
      toast.error(t("processFailed"));
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm(t("confirmDelete") || "Haqiqatdan ham o'chirmoqchimisiz?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/manage/users/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(t("processSuccess"));
      fetchUsers(adminToken);
    } catch (err) {
      toast.error(t("processFailed"));
    }
  };

  const handleBlockUser = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/manage/users/${blockingUser._id}/block`, {
        isBlocked: true,
        blockedUntil: blockingUser.blockedUntil
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(t("processSuccess"));
      setBlockingUser(null);
      fetchUsers(adminToken);
    } catch (err) {
      toast.error(t("processFailed"));
    }
  };

  const handleUnblock = async (id) => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/manage/users/${id}/block`, {
        isBlocked: false
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(t("processSuccess"));
      fetchUsers(adminToken);
    } catch (err) {
      toast.error(t("processFailed"));
    }
  };

  const sendAdminCommand = async (e) => {
    e.preventDefault();
    const command = adminChatInput.trim();
    if (!command || adminChatLoading) return;

    setAdminChatMessages(prev => [...prev, { role: "user", text: command }]);
    setAdminChatInput("");
    setAdminChatLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/admin/manage/assistant`, {
        message: command
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      setAdminChatMessages(prev => [...prev, {
        role: "assistant",
        text: data.reply || "Buyruq bajarildi."
      }]);

      if (data.executed) {
        toast.success("Admin buyrug'i bajarildi");
        fetchUsers(adminToken);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Admin assistant javob qaytarmadi";
      setAdminChatMessages(prev => [...prev, { role: "assistant", text: message }]);
      toast.error(message);
    } finally {
      setAdminChatLoading(false);
    }
  };

  if (!adminToken) return null;

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tightest uppercase gradient-text">Admin Panel</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-60">System Management Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/analytics" className="px-6 py-3 bg-brandA/10 text-brandA rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brandA/20 transition-colors duration-150 flex items-center gap-2">
            <FiPieChart className="w-4 h-4" />
            Analytics Dashboard
          </Link>
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
            <button 
              onClick={() => setActiveTab("users")}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-150 ${activeTab === 'users' ? 'bg-white dark:bg-slate-800 shadow-sm text-brandA' : 'text-slate-500'}`}
            >
              Users
            </button>
            <button 
              onClick={() => setActiveTab("content")}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-150 ${activeTab === 'content' ? 'bg-white dark:bg-slate-800 shadow-sm text-brandA' : 'text-slate-500'}`}
            >
              Content
            </button>
            <button 
              onClick={() => setActiveTab("assistant")}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-150 flex items-center gap-2 ${activeTab === 'assistant' ? 'bg-white dark:bg-slate-800 shadow-sm text-brandA' : 'text-slate-500'}`}
            >
              <FiMessageSquare className="w-3.5 h-3.5" />
              AI Chat
            </button>
          </div>
        </div>
      </div>

      <div>
        {activeTab === "users" ? (
          <div className="flex flex-col gap-2">
            <ManagementBar 
              onSearch={(val) => setSearchTerm(val.toLowerCase())}
              onFilter={() => toast("Filter clicked")}
              onAdd={() => toast("Add user functionality here")}
            />
            
            <div className="card p-0 overflow-hidden border-none shadow-2xl">
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
                    {users.filter(u => 
                      u.email.toLowerCase().includes(searchTerm) || 
                      (u.name && u.name.toLowerCase().includes(searchTerm))
                    ).map(u => (
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
                          <button onClick={() => setEditingUser(u)} aria-label="Edit user" className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                          <button onClick={() => setBlockingUser(u)} aria-label="Block user" className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors" title="Block"><FiSlash className="w-4 h-4" /></button>
                          {u.isBlocked && <button onClick={() => handleUnblock(u._id)} aria-label="Unblock user" className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors" title="Unblock"><FiUnlock className="w-4 h-4" /></button>}
                          <button onClick={() => handleDeleteUser(u._id)} aria-label="Delete user" className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        ) : activeTab === "content" ? (
          <div className="card p-10 max-w-xl mx-auto">
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
                toast.success(t("processSuccess"));
                e.target.reset();
              } catch (err) {
                toast.error(t("processFailed"));
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <input name="title" className="input py-4" placeholder="Presentation Title" required />
              <input name="category" className="input py-4" placeholder="Category" required />
              <input name="fileUrl" className="input py-4" placeholder="File URL (https://...)" required />
              <button disabled={loading} className="btn-primary w-full py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                {loading ? t("loading") : <><FiUpload className="w-4 h-4" /> Upload Presentation</>}
              </button>
            </form>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden border-none shadow-2xl max-w-4xl mx-auto">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-brandA text-white flex items-center justify-center shadow-lg shadow-brandA/20">
                  <FiMessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">AcademiQ Admin Assistant</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin commands</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                <FiZap className="w-3.5 h-3.5" />
                Active
              </div>
            </div>

            <div className="h-[440px] overflow-y-auto no-scrollbar p-6 space-y-4 bg-white dark:bg-slate-950">
              {adminChatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm font-semibold leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-br-none"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {adminChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brandA animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brandA animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brandA animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={sendAdminCommand} className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="relative">
                <input
                  className="w-full py-4 pl-5 pr-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm font-bold text-sm outline-none focus:ring-4 ring-brandA/10"
                  placeholder="Buyruq yozing..."
                  value={adminChatInput}
                  onChange={(e) => setAdminChatInput(e.target.value)}
                  disabled={adminChatLoading}
                />
                <button
                  type="submit"
                  aria-label="Admin buyrugini yuborish"
                  disabled={!adminChatInput.trim() || adminChatLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-slate-900 dark:bg-brandA text-white flex items-center justify-center disabled:opacity-20 transition-colors duration-150 hover:scale-105 active:scale-95"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="card w-full max-w-md p-8 bg-white dark:bg-slate-900">
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
                <div className="relative group">
                  <select 
                    className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl font-bold text-sm appearance-none outline-none focus:ring-4 ring-brandA/10 border-2 border-transparent focus:border-brandA transition-colors duration-150"
                    value={editingUser.planType}
                    onChange={e => setEditingUser({...editingUser, planType: e.target.value})}
                  >
                    <option value="free">FREE PLAN</option>
                    <option value="pro">PRO PLAN</option>
                    <option value="pro_plus">PRO+ PLAN</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brandA opacity-40 group-hover:opacity-100 transition-opacity">
                    <FiChevronDown />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Credits</label>
                  <input 
                    type="number"
                    className="input py-3.5" 
                    value={editingUser.credits} 
                    onChange={e => setEditingUser({...editingUser, credits: parseInt(e.target.value)})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reward Balance</label>
                  <input 
                    type="number"
                    className="input py-3.5" 
                    value={editingUser.rewardBalance} 
                    onChange={e => setEditingUser({...editingUser, rewardBalance: parseInt(e.target.value)})} 
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Unlimited Credits</label>
                <button
                  type="button"
                  onClick={() => setEditingUser({...editingUser, isUnlimitedCredits: !editingUser.isUnlimitedCredits})}
                  className={`w-12 h-6 rounded-full transition-colors duration-150 relative ${editingUser.isUnlimitedCredits ? 'bg-brandA' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-colors duration-150 ${editingUser.isUnlimitedCredits ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {blockingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="card w-full max-w-md p-8 bg-white dark:bg-slate-900">
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
          </div>
        </div>
      )}
    </div>
  );
}
