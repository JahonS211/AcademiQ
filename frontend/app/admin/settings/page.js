"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiTag } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newPromo, setNewPromo] = useState({
    code: "",
    discountPercent: 10,
    usageLimit: 0,
  });

  const fetchPromos = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("https://academiq-api-hsvi.onrender.com/api/admin/promo", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromos(data.promos || []);
    } catch (err) {
      toast.error("Promokodlarni yuklashda xatolik");
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("https://academiq-api-hsvi.onrender.com/api/admin/promo", newPromo, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Promokod yaratildi!");
      setNewPromo({ code: "", discountPercent: 10, usageLimit: 0 });
      fetchPromos();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://academiq-api-hsvi.onrender.com/api/admin/promo/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("O'chirildi!");
      fetchPromos();
    } catch (err) {
      toast.error("O'chirishda xatolik");
    }
  };

  if (loading) return <div className="p-8">Yuklanmoqda...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Sozlamalar va Promokodlar</h1>
        <p className="text-slate-500 font-medium">Tizim sozlamalari va chegirma kodlarini boshqarish</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiPlus className="text-brandA" /> Yangi Promokod
            </h2>
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Kod (Masalan: MARHAMAT)</label>
                <input 
                  required
                  type="text" 
                  className="input" 
                  value={newPromo.code}
                  onChange={e => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Chegirma Foizi (%)</label>
                <input 
                  required
                  type="number" 
                  min="1" max="100"
                  className="input" 
                  value={newPromo.discountPercent}
                  onChange={e => setNewPromo({ ...newPromo, discountPercent: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Ishlatish Limiti (0 = cheksiz)</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  className="input" 
                  value={newPromo.usageLimit}
                  onChange={e => setNewPromo({ ...newPromo, usageLimit: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary w-full text-xs uppercase tracking-widest font-black">
                Yaratish
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="card overflow-hidden">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiTag className="text-brandA" /> Faol Promokodlar
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Kod</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Chegirma</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Limit</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Ishlatildi</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.length === 0 ? (
                     <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-500">Promokodlar yo'q</td>
                     </tr>
                  ) : promos.map(promo => (
                    <tr key={promo._id} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-3 px-4 font-bold text-indigo-600">{promo.code}</td>
                      <td className="py-3 px-4 font-medium">{promo.discountPercent}%</td>
                      <td className="py-3 px-4 text-sm">{promo.usageLimit === 0 ? "Cheksiz" : promo.usageLimit}</td>
                      <td className="py-3 px-4 text-sm">{promo.usedCount}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleDeletePromo(promo._id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
