"use client";

import { API_BASE_URL } from "../../lib/config";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { FiZap, FiArrowRight, FiCopy, FiCamera, FiRefreshCw, FiStar } from "react-icons/fi";

const API_BASE = `${API_BASE_URL}`;
const CREDIT_PRICE = 100; // Base price
const PENDING_PAYMENT_KEY = "academiq_pending_payment";

const PACKAGES = [
  { credits: 300, price: 25000, label: "Boshlang'ich", popular: false, color: "from-blue-500 to-indigo-600" },
  { credits: 500, price: 40000, label: "Ommabop", popular: true, color: "from-indigo-600 to-violet-700" },
  { credits: 1000, price: 70000, label: "Maximal", popular: false, color: "from-violet-700 to-fuchsia-800" },
];

export default function BuyCreditsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const ready = useRequireAuth();
  const pollingRef = useRef(null);

  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState(300);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  
  const [promoCode, setPromoCode] = useState("");
  const [promoInfo, setPromoInfo] = useState(null);
  const [useRewards, setUseRewards] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReceiptUploaded, setIsReceiptUploaded] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const [history, setHistory] = useState([]);

  const savePendingPayment = (payment, receiptUploaded = false) => {
    if (!payment?.code) return;
    localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({
      payment,
      receiptUploaded,
      savedAt: Date.now(),
    }));
  };

  const clearPendingPayment = () => {
    localStorage.removeItem(PENDING_PAYMENT_KEY);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { data } = await axios.get(`${API_BASE}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (data.success) setUser(data.user);
        } catch (e) {}
      }
    };
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { data } = await axios.get(`${API_BASE}/api/payment/history`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setHistory(data.history || []);
        } catch (e) {}
      }
    };
    fetchUser();
    fetchHistory();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      if (!saved?.payment?.code) return;
      setPaymentInfo(saved.payment);
      setIsReceiptUploaded(Boolean(saved.receiptUploaded));
      setIsPaid(false);
      setSelectedFile(null);
      setShowModal(true);
      startPolling(saved.payment.code);
    } catch (error) {
      clearPendingPayment();
    }
  }, [ready]);

  const calculatePrice = (qty) => {
    const pkg = PACKAGES.find(p => p.credits === qty);
    if (pkg) return pkg.price;
    // Basic bulk discount for custom amounts
    if (qty >= 1000) return qty * 70;
    if (qty >= 500) return qty * 80;
    if (qty >= 300) return qty * 85;
    return qty * CREDIT_PRICE;
  };

  const currentPrice = calculatePrice(isCustom ? (parseInt(customAmount) || 0) : amount);
  const promoDiscount = promoInfo ? Math.floor((currentPrice * Number(promoInfo.discountPercent || 0)) / 100) : 0;
  const afterPromoPrice = Math.max(currentPrice - promoDiscount, 0);
  const rewardsDiscount = useRewards ? Math.min(Number(user?.rewardBalance || 0), afterPromoPrice) : 0;
  const payablePrice = Math.max(afterPromoPrice - rewardsDiscount, 0);

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API_BASE}/api/promo/validate`, { code: promoCode }, { headers: { Authorization: `Bearer ${token}` } });
      if (data.promo.type === 'plan') {
         return toast.error("Ushbu promo faqat tariflar uchun amal qiladi");
      }
      setPromoInfo(data.promo);
      toast.success("Promo applied");
    } catch (e) {
      setPromoInfo(null);
      toast.error(e.response?.data?.message || "Invalid promo");
    }
  };

  const handlePurchase = async (overrideRewards = useRewards) => {
    const finalAmount = isCustom ? (parseInt(customAmount) || 0) : amount;
    if (finalAmount < 10) return toast.error("Minimal 10 ta kredit sotib olish mumkin");
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API_BASE}/api/payment/create`, {
        type: "credits",
        amount: finalAmount,
        promoCode: promoInfo?.code || promoCode || "",
        useRewards: overrideRewards
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPaymentInfo(data.payment);
      savePendingPayment(data.payment, false);
      setShowModal(true);
      setIsReceiptUploaded(false);
      setIsPaid(false);
      setSelectedFile(null);
      startPolling(data.payment.code);
    } catch (err) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (code) => {
    if (!code) return;
    if (pollingRef.current) clearInterval(pollingRef.current);

    const checkStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_BASE}/api/payment/status/${code}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.status === "paid") {
          setIsPaid(true);
          toast.success("To'lov tasdiqlandi!");
          clearPendingPayment();
          if (pollingRef.current) clearInterval(pollingRef.current);
          setTimeout(() => {
            setShowModal(false);
            router.push("/chat");
          }, 3000);
        } else if (data.status === "rejected") {
          toast.error("To'lov rad etildi. Iltimos, supportga murojaat qiling.");
          clearPendingPayment();
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    checkStatus();
    pollingRef.current = setInterval(checkStatus, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  };

  const handleUploadReceipt = async () => {
    if (!selectedFile) return toast.error("Iltimos, chekni tanlang!");
    setIsUploading(true);
    const formData = new FormData();
    formData.append("receipt", selectedFile);
    formData.append("paymentId", paymentInfo.id);

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/api/payment/upload-receipt`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Chek yuklandi!");
      setIsReceiptUploaded(true);
      savePendingPayment(paymentInfo, true);
    } catch (err) {
      toast.error("Yuklashda xatolik");
    } finally {
      setIsUploading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brandA/10 text-brandA rounded-full border border-brandA/20 mb-2">
          <FiZap className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Kreditlar balansi</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-slate-800 dark:text-white">
          Balansni to'ldirish
        </h1>
        <p className="text-slate-500 font-medium text-sm max-w-lg mx-auto">
          AI xizmatlaridan cheklovlarsiz foydalanish uchun o'zingizga mos paketni tanlang.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {PACKAGES.map((pkg, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -8 }}
            onClick={() => { setAmount(pkg.credits); setIsCustom(false); }}
            className={`relative p-1 rounded-[2.5rem] cursor-pointer transition-all ${
              !isCustom && amount === pkg.credits 
                ? `bg-gradient-to-b ${pkg.color} ring-4 ring-brandA/20 scale-[1.02]` 
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            } shadow-2xl group`}
          >
            {pkg.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-brandA to-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-full shadow-[0_10px_25px_-5px_rgba(var(--brandA-rgb),0.5)] z-10 border border-white/20">
                Eng Mashhur
              </div>
            )}
            <div className="bg-white dark:bg-slate-900 rounded-[2.3rem] p-8 h-full flex flex-col items-center text-center space-y-6">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pkg.color} flex items-center justify-center text-white text-2xl shadow-lg`}>
                <FiZap />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tight">{pkg.credits} Kredit</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{pkg.label}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{pkg.price.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">UZS</span>
              </div>
              <div className={`w-full py-4 rounded-xl border-2 ${!isCustom && amount === pkg.credits ? "border-brandA bg-brandA/5 text-brandA" : "border-slate-100 dark:border-slate-800 text-slate-400"} text-[10px] font-black uppercase tracking-widest transition-all`}>
                {!isCustom && amount === pkg.credits ? "Tanlangan" : "Tanlash"}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className={`card p-6 md:p-10 transition-all border-none shadow-2xl ${isCustom ? "ring-2 ring-brandA bg-brandA/[0.03]" : "bg-white dark:bg-slate-900"}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isCustom ? "bg-brandA text-white shadow-xl shadow-brandA/20 scale-110" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                   <FiRefreshCw className={`text-xl ${isCustom ? "animate-spin-slow" : ""}`} />
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight leading-none">Boshqa Miqdor</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Kredit miqdorini o'zingiz kiriting</p>
                </div>
             </div>
             <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                   <input 
                      type="number"
                      placeholder="Masalan: 250"
                      className="w-full py-6 px-8 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] font-black text-center text-xl outline-none transition-all border-2 border-transparent focus:border-brandA ring-brandA/5 focus:ring-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={customAmount}
                      onFocus={() => setIsCustom(true)}
                      onChange={(e) => setCustomAmount(e.target.value)}
                   />
                </div>
                <button 
                  onClick={() => setIsCustom(true)}
                  className={`px-10 py-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${isCustom ? "bg-brandA text-white shadow-brandA/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`}
                >
                  TASDIQLASH
                </button>
             </div>
          </div>
        </div>


        <div className="card p-5 md:p-6 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem]">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Promo va bonus</label>
                {promoInfo && (
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                    -{promoInfo.discountPercent}% off
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1 py-4 px-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-none font-black text-sm"
                  placeholder="Promo kod"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoInfo(null);
                  }}
                />
                <button
                  onClick={validatePromo}
                  className="px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 min-w-[220px]">
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Rewards balance</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{user?.rewardBalance?.toLocaleString() || 0} UZS</p>
              </div>
              <button
                onClick={() => setUseRewards((v) => !v)}
                className={`w-14 h-8 rounded-full transition-all flex items-center px-1.5 ${useRewards ? "bg-brandA shadow-lg shadow-brandA/20" : "bg-slate-200 dark:bg-slate-700"}`}
              >
                <motion.div animate={{ x: useRewards ? 24 : 0 }} className="w-5 h-5 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </div>
        <div className="card p-10 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group rounded-[3rem]">
           <div className="absolute -right-20 -top-20 w-80 h-80 bg-brandA/20 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-3 text-center md:text-left">
                 <div className="flex items-center justify-center md:justify-start gap-2 text-brandA">
                    <FiStar className="fill-current animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Hisobingizni to'ldiring</span>
                 </div>
                 <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">
                    {isCustom ? (parseInt(customAmount) || 0) : amount} Kredit = <br className="md:hidden" />
                    <span className="text-brandA ml-2">{payablePrice.toLocaleString()} UZS</span>
                 </h2>
                 {payablePrice < currentPrice && (
                   <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">
                     <span className="line-through opacity-50 mr-2">{currentPrice.toLocaleString()} UZS</span>
                     <span className="text-emerald-400">-{(promoDiscount + rewardsDiscount).toLocaleString()} UZS chegirma</span>
                   </p>
                 )}
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-60">To'lovdan so'ng kreditlar darhol qo'shiladi.</p>
              </div>
              <button
                onClick={() => handlePurchase()}
                disabled={loading || (!isCustom && !amount) || (isCustom && !customAmount)}
                className="w-full md:w-auto px-12 py-7 rounded-[2rem] bg-white text-slate-900 text-sm font-black uppercase tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:bg-brandA hover:text-white transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Loading..." : <>TO'LOV QILISH <FiArrowRight className="text-lg" /></>}
              </button>
           </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[2rem] p-6 md:p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 animate-in zoom-in-95 duration-300">
            {isPaid ? (
              <div className="flex flex-col items-center text-center py-8 animate-in slide-in-from-bottom-10 duration-700">
                <div className="w-20 h-20 bg-green-500 text-white rounded-[2rem] flex items-center justify-center text-4xl shadow-[0_20px_40px_-10px_rgba(34,197,94,0.5)] mb-6 animate-bounce">✓</div>
                <h2 className="text-2xl font-black mb-2 tracking-tighter uppercase">{t("processSuccess")}!</h2>
                <p className="text-xs text-slate-500 mb-8 font-bold uppercase tracking-widest">To'lov tasdiqlandi. Rahmat!</p>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 animate-[progress_3s_linear]" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-black tracking-tightest uppercase leading-none">To'lovni Tasdiqlash</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chekni yuboring va kuting</p>
                </div>

                <div className="space-y-3">
                  <div className="hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                         <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Promo code</p>
                         {promoInfo && <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md animate-pulse">-{promoInfo.discountPercent}% OFF</span>}
                      </div>
                      <div className="flex gap-2">
                        <input className="input py-2.5 px-4 text-xs font-bold bg-white dark:bg-slate-900 border-none shadow-inner" placeholder="Kodni kiriting" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                        <button onClick={validatePromo} className="px-5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95">Apply</button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Rewards balance</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{user?.rewardBalance?.toLocaleString() || 0} UZS</p>
                      </div>
                      <button 
                        onClick={() => { setUseRewards(!useRewards); handlePurchase(!useRewards); }} 
                        className={`w-14 h-8 rounded-full transition-all flex items-center px-1.5 ${useRewards ? "bg-brandA shadow-lg shadow-brandA/20" : "bg-slate-200 dark:bg-slate-700"}`}
                      >
                        <motion.div animate={{ x: useRewards ? 24 : 0 }} className="w-5 h-5 rounded-full bg-white shadow-md" />
                      </button>
                    </div>
                  </div>

                  <div onClick={() => { navigator.clipboard.writeText("5614682774034609"); toast.success(t("copied")); }} className="p-5 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-600/20 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex justify-between items-center group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="relative z-10">
                      <p className="text-[8px] font-black uppercase opacity-60 mb-1 tracking-[0.2em]">{t("cardNumber")}</p>
                      <p className="text-sm font-mono font-black tracking-[0.25em]">5614 6827 7403 4609</p>
                    </div>
                    <span className="relative z-10 text-lg opacity-40 group-hover:opacity-100 transition-opacity"><FiCopy /></span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] text-slate-400 font-black uppercase mb-1 tracking-[0.2em]">To'lov</p>
                      {paymentInfo?.originalAmount > paymentInfo?.amount && (
                        <p className="text-[10px] font-black text-slate-400 line-through mb-0.5">{paymentInfo.originalAmount.toLocaleString()} UZS</p>
                      )}
                      <p className="text-sm font-black text-slate-900 dark:text-white">{paymentInfo?.amount?.toLocaleString()} UZS</p>
                      {paymentInfo?.promoDiscountPercent > 0 && (
                        <p className="text-[9px] font-black text-emerald-500 mt-1">-{paymentInfo.promoDiscountPercent}% promo</p>
                      )}
                    </div>
                    <div className="p-4 bg-brandA/5 rounded-2xl border-2 border-dashed border-brandA/30 relative">
                      <p className="text-[8px] text-brandA font-black uppercase mb-1 tracking-[0.2em]">Izoh kodi</p>
                      <p className="text-sm font-mono font-black text-brandA">{paymentInfo?.code}</p>
                    </div>
                  </div>

                  {!isReceiptUploaded ? (
                    <div className="space-y-4 pt-2">
                      <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center hover:border-brandA transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/20 group">
                        <input type="file" id="receipt-upload" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} accept="image/*,.pdf" />
                        <label htmlFor="receipt-upload" className="cursor-pointer block">
                          <div className="text-3xl mb-2 text-brandA flex justify-center group-hover:scale-110 transition-transform"><FiCamera /></div>
                          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 truncate max-w-[180px] mx-auto">{selectedFile ? selectedFile.name : "Chekni tanlang"}</p>
                        </label>
                      </div>
                      <button onClick={handleUploadReceipt} disabled={!selectedFile || isUploading} className="w-full py-5 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all">
                        {isUploading ? "Yuklanmoqda..." : "Tasdiqlash"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center bg-brandA/5 rounded-[2rem] border border-brandA/10 text-center animate-pulse">
                      <div className="w-10 h-10 border-4 border-brandA border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-[10px] font-black text-brandA uppercase tracking-widest mb-1">{t("waitAdmin")}</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase opacity-50 italic">Tasdiqlash kutilmoqda...</p>
                    </div>
                  )}

                  <button onClick={() => setShowModal(false)} className="w-full py-2 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] hover:text-slate-600 transition-colors mt-2">Yopish</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* History Table */}
      <div className="max-w-4xl mx-auto pt-10">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h2 className="text-xl font-black uppercase tracking-tightest">To'lovlar Tarixi</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Oxirgi tranzaksiyalaringiz</p>
           </div>
           <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FiRefreshCw className="animate-spin-slow" />
           </div>
        </div>

        <div className="card overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Sana</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Turi</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Miqdor</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {!history.length && (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center text-slate-400">
                       <p className="text-[11px] font-black uppercase tracking-widest">Hozircha to'lovlar mavjud emas</p>
                    </td>
                  </tr>
                )}
                {history.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5">
                      <span className="text-[11px] font-bold text-slate-500">{new Date(h.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">
                          {h.type === "plan" ? `Tarif (${h.plan})` : "Kreditlar"}
                        </span>
                        {h.type === "credits" && (
                          <span className="text-[10px] font-bold text-brandA">+{h.creditAmount} ta</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{h.amount.toLocaleString()} UZS</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        h.status === "paid" ? "bg-emerald-100 text-emerald-600" : 
                        h.status === "pending" ? "bg-amber-100 text-amber-600" : 
                        "bg-rose-100 text-rose-600"
                      }`}>
                        {h.status === "paid" ? "Tasdiqlangan" : h.status === "pending" ? "Kutilmoqda" : "Rad etilgan"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
