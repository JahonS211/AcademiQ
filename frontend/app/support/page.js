"use client";

import { API_BASE_URL } from "../../lib/config";
import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { FiTool, FiCreditCard, FiStar, FiMessageCircle, FiCheckCircle, FiSend, FiZap, FiClock, FiCheckSquare, FiPlusCircle } from "react-icons/fi";
import { FaTelegramPlane } from "react-icons/fa";

const SUBJECTS = [
  { label: "Texnik muammo", icon: <FiTool /> },
  { label: "To'lov masalasi", icon: <FiCreditCard /> },
  { label: "Tarif haqida", icon: <FiStar /> },
  { label: "Taklif / yangi funksiya", icon: <FiPlusCircle /> },
  { label: "Boshqa savol", icon: <FiMessageCircle /> },
];

const FAQ = [
  { q: "Qanday ro'yxatdan o'taman?", a: "Sahifa tepasidagi 'Register' tugmasini bosing va email va parol kiriting." },
  { q: "Pro tarif qanday ishlaydi?", a: "Pro tarifga o'tish uchun 'Premium' sahifasiga o'ting va kerakli tarifni tanlang." },
  { q: "To'lovni qanday tasdiqlaman?", a: "To'lov kvitansiyasini yuklab, admin tasdiqlashini kuting. Odatda 1-2 soat ichida." },
  { q: "Parolimni unutdim, nima qilaman?", a: "Hozircha support orqali murojaat qiling, biz yordam beramiz." },
];

export default function SupportPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [subject, setSubject] = useState(SUBJECTS[0].label);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const isSuggestion = subject === "Taklif / yangi funksiya";

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error("Xabar bo'sh bo'lmasligi kerak!");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/support`,
        { subject, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSent(true);
      setMessage("");
      toast.success("Xabaringiz muvaffaqiyatli yuborildi! Tez orada javob beramiz.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-[2rem] flex items-center justify-center text-3xl mx-auto shadow-2xl shadow-indigo-500/30">
          <FiMessageCircle />
        </div>
        <h1 className="text-5xl font-black tracking-tightest uppercase text-slate-900 dark:text-white">
          Biz bilan bog'laning
        </h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest max-w-md mx-auto">
          Savolingiz bormi? 24/7 yordam berishga tayyormiz
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-8 border-indigo-500/10"
        >
          {sent ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-12 gap-6"
            >
              <div className="text-6xl text-green-500"><FiCheckCircle /></div>
              <h3 className="text-2xl font-black uppercase tracking-tightest">Yuborildi!</h3>
              <p className="text-slate-400 font-bold text-sm">
                Xabaringiz adminlarga yuborildi. Tez orada Telegram orqali javob olasiz.
              </p>
              <button
                onClick={() => setSent(false)}
                className="btn-primary px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl"
              >
                Yangi xabar yuborish
              </button>
            </motion.div>
          ) : (
            <>
              <h2 className="text-xl font-black uppercase tracking-tightest mb-6">Xabar yuborish</h2>
              
              {/* Subject Picker */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSubject(s.label)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all text-xs font-black flex items-center gap-2 ${
                      subject === s.label
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                        : "border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    {isSuggestion ? "Taklifingiz" : "Xabaringiz"}
                  </label>
                  <textarea
                    className="input h-40 py-4 px-5 rounded-2xl resize-none bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 ring-indigo-500/20 text-sm font-medium leading-relaxed"
                    placeholder={isSuggestion ? "Qanday funksiya kerak, qaysi sahifaga qo'shilsin va nima uchun foydali bo'lishini yozing..." : "Muammoingizni yoki savolingizni yozing..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                {isSuggestion && (
                  <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-4 text-xs font-semibold leading-6 text-slate-500 dark:text-slate-300">
                    Taklif yozishda funksiya nomi, qayerda ko'rinishi, qanday ishlashi va sizga qanday yordam berishini qisqa yozsangiz, tezroq ko'rib chiqamiz.
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><span>Yuborish</span><FiSend className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>

        {/* Right: Telegram link + FAQ */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
            className="card border-violet-500/15 bg-gradient-to-br from-violet-50 to-indigo-50/60 p-7 dark:from-violet-950/20 dark:to-indigo-950/10"
          >
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-xl text-white shadow-lg shadow-violet-600/20">
                <FiPlusCircle />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">Takliflar</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Yangi funksiya so'rang</h3>
              </div>
            </div>
            <p className="text-sm font-semibold leading-7 text-slate-500 dark:text-slate-300">
              Saytda kerak bo'lgan yangi bo'lim, qulaylik yoki AI funksiyani yozib qoldiring. Adminlar ko'rib chiqib, kerakli joyga qo'shadi.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubject("Taklif / yangi funksiya");
                setSent(false);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-violet-600/20"
            >
              Taklif yozish
              <FiSend />
            </button>
          </motion.div>

          {/* Telegram Card */}
          <motion.a
            href="https://t.me/thinky_help"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="card p-8 flex items-center gap-6 border-blue-500/20 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 cursor-pointer group transition-all block"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-3xl shadow-xl shadow-blue-500/30 flex-shrink-0 group-hover:scale-110 transition-transform">
              <FaTelegramPlane />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">
                Telegram Support
              </p>
              <h3 className="text-xl font-black text-blue-700 dark:text-blue-300">
                @thinky_help
              </h3>
              <p className="text-xs text-blue-500/70 font-bold mt-1">
                Tez javob • 24/7 online
              </p>
            </div>
            <div className="ml-auto text-blue-400 text-2xl group-hover:translate-x-1 transition-transform">
              →
            </div>
          </motion.a>

          {/* Response Time Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6 grid grid-cols-3 gap-4 border-none bg-slate-50 dark:bg-slate-900"
          >
            {[
              { icon: <FiZap />, label: "Javob vaqti", value: "< 1 soat" },
              { icon: <FiClock />, label: "Ish vaqti", value: "24/7" },
              { icon: <FiCheckSquare />, label: "Hal qilingan", value: "500+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center space-y-2 flex flex-col items-center">
                <div className="text-2xl text-slate-400">{stat.icon}</div>
                <p className="font-black text-lg text-indigo-600 dark:text-indigo-400">{stat.value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="card p-6 border-none space-y-2"
          >
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
              Ko'p so'raladigan savollar
            </h3>
            {FAQ.map((item, i) => (
              <div key={i} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-black uppercase tracking-tight hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <span className="text-slate-700 dark:text-slate-300">{item.q}</span>
                  <span className={`transition-transform duration-300 text-indigo-500 ${openFaq === i ? "rotate-180" : ""}`}>▾</span>
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-4 pb-4 text-xs text-slate-500 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3"
                  >
                    {item.a}
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
