"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { referralApi } from "../../lib/api";
import useRequireAuth from "../../lib/useRequireAuth";
import { motion } from "framer-motion";

export default function ReferralsPage() {
  const ready = useRequireAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!ready) return;
    referralApi
      .me()
      .then((r) => setData(r.data))
      .catch((e) => toast.error(e.response?.data?.message || "Failed to load"));
  }, [ready]);

  const link = data?.referralLink || "";
  const stats = useMemo(
    () => [
      { label: "Total", value: data?.totalReferrals ?? 0 },
      { label: "Paid", value: data?.paidReferrals ?? 0 },
      { label: "Earnings", value: (data?.referralEarnings ?? 0).toLocaleString() },
    ],
    [data]
  );

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Copied");
  };

  if (!ready) return null;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="card p-8 border-none shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-brandA/10 rounded-full blur-3xl" />
        <h1 className="text-2xl font-black tracking-tighter uppercase">Referrals</h1>
        <p className="text-slate-500 text-sm font-medium mt-2">
          Invite friends and earn rewards when they purchase premium.
        </p>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
              <p className="text-2xl font-black mt-2">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <input className="input" readOnly value={link} />
          <button onClick={copy} className="btn-primary px-8 py-3 text-[10px] font-black uppercase tracking-widest">
            Copy link
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
            Recent referrals
          </p>
        </div>
        <div className="divide-y divide-slate-200/30 dark:divide-slate-800/30">
          {(data?.recent || []).map((r) => (
            <div key={r._id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-black">{r.referredUserId?.email || "User"}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                  {r.status}
                </p>
              </div>
              <p className="text-sm font-black">{(r.rewardAmount || 0).toLocaleString()}</p>
            </div>
          ))}
          {!data?.recent?.length && <div className="px-6 py-8 text-sm text-slate-500">No referrals yet.</div>}
        </div>
      </motion.div>
    </div>
  );
}

