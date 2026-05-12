"use client";

import { API_BASE_URL } from "../../lib/config";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import { promoApi, rewardsApi, presenceApi } from "../../lib/api";
import { FiCheckCircle, FiCopy, FiCamera, FiRefreshCw, FiZap } from "react-icons/fi";

export default function PricingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportMsg, setSupportMsg] = useState("");
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReceiptUploaded, setIsReceiptUploaded] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoInfo, setPromoInfo] = useState(null);
  const [useRewards, setUseRewards] = useState(false);
  const [rewardsInfo, setRewardsInfo] = useState(null);

  useEffect(() => {
    const syncUser = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) setUser(JSON.parse(savedUser));
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const interval = setInterval(() => {
      presenceApi.ping().catch(() => {});
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const { data } = await promoApi.validate({ code: promoCode });
      setPromoInfo(data.promo);
      toast.success("Promo applied");
      if (paymentInfo) {
        handleSubscribe(paymentInfo.plan, paymentInfo.originalAmount, useRewards);
      }
    } catch (e) {
      setPromoInfo(null);
      toast.error(e.response?.data?.message || "Invalid promo");
    }
  };

  const recalcRewards = async (amount) => {
    try {
      const { data } = await rewardsApi.apply({ amount, useRewards });
      setRewardsInfo(data);
    } catch (e) {
      setRewardsInfo(null);
    }
  };

  useEffect(() => {
    const savedPayment = localStorage.getItem("activePayment");
    if (savedPayment) {
      const parsed = JSON.parse(savedPayment);
      setPaymentInfo(parsed);
      setShowModal(true);
      if (parsed.receiptUploaded) setIsReceiptUploaded(true);
      startPolling(parsed.code);
    }
  }, []);

  const handleSubscribe = async (plan, price, overrideRewards = useRewards) => {
    if (price === 0) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Iltimos, oldin tizimga kiring!");
      return router.push("/login");
    }

    setLoading(plan);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/payment/create`, 
        { plan, promoCode: promoInfo?.code || promoCode || "", useRewards: overrideRewards }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newPayment = data.payment;
      setPaymentInfo(newPayment);
      setShowModal(true);
      setIsReceiptUploaded(false);
      setIsPaid(false);
      setSelectedFile(null);
      setRewardsInfo(null);
      
      // Persist
      localStorage.setItem("activePayment", JSON.stringify({ ...newPayment, receiptUploaded: false }));
      
      recalcRewards(newPayment.amount);
      startPolling(newPayment.code);
    } catch (err) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(null);
    }
  };

  const pollingRef = useRef(null);

  const startPolling = (code) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setCheckingStatus(true);
    
    pollingRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_BASE_URL}/api/payment/status/${code}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.status === "paid") {
          setIsPaid(true);
          toast.success("To'lov tasdiqlandi!");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          
          localStorage.removeItem("activePayment");
          
          const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
          const updatedUser = { ...savedUser, planType: data.payment?.plan || "pro" };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          
          setTimeout(() => {
            setShowModal(false);
            window.location.reload();
          }, 3000);
        } else if (data.status === "rejected") {
          toast.error("To'lov bekor qilindi.");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          localStorage.removeItem("activePayment");
          setShowModal(false);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleSupport = async () => {
    if (!supportMsg) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/api/payment/support`, 
        { message: supportMsg }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Xabar yuborildi!");
      setShowSupport(false);
      setSupportMsg("");
    } catch (err) {
      toast.error("Xatolik: Tizimga kiring.");
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadReceipt = async () => {
    if (!selectedFile) return toast.error("Iltimos, chekni tanlang!");
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("receipt", selectedFile);
    formData.append("paymentId", paymentInfo.id);

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/api/payment/upload-receipt`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Chek yuklandi! Admin tasdig'i kutilmoqda.");
      setIsReceiptUploaded(true);
      const saved = JSON.parse(localStorage.getItem("activePayment") || "{}");
      localStorage.setItem("activePayment", JSON.stringify({ ...saved, receiptUploaded: true }));
    } catch (err) {
      toast.error("Yuklashda xatolik yuz berdi");
    } finally {
      setIsUploading(false);
    }
  };

  const features = [
    { name: "AI Kreditlar", free: "25 ta", pro: "150 ta", pro_plus: "500 ta" },
    { name: "Insho yaratish", free: "✔", pro: "✔", pro_plus: "Cheksiz" },
    { name: "Grammarly AI", free: false, pro: true, pro_plus: true },
    { name: "AI Detector", free: false, pro: true, pro_plus: true },
    { name: "ZIP Arxivator", free: false, pro: true, pro_plus: true },
    { name: "Taqdimot yaratish", free: false, pro: true, pro_plus: true },
    { name: "Ilg'or AI modellari", free: false, pro: true, pro_plus: true },
    { name: "Prioritet yordam", free: false, pro: true, pro_plus: true },
  ];

  const tiers = [
    {
      name: "Free",
      price: "0",
      description: "Thinky imkoniyatlarini sinab ko'ring",
      features: ["25 ta AI Kredit", "Barcha asboblar", "Asosiy AI modellari"],
      buttonText: "Boshlash",
      planId: "free",
      priceNum: 0,
    },
    {
      name: "Pro",
      price: "14 990",
      description: "Kengaytirilgan imkoniyatlar bilan o'qing",
      features: ["150 ta AI Kredit", "Ilg'or AI modellari", "Tezroq javob", "Prioritet yordam"],
      buttonText: "Pro'ga o'tish",
      planId: "pro",
      priceNum: 14990,
    },
    {
      name: "Pro+",
      price: "24 990",
      description: "Barcha cheklovlarni olib tashlang",
      features: ["500 ta AI Kredit", "Barcha premium xizmatlar", "Eng tezkor javob", "24/7 VIP Yordam"],
      buttonText: "Pro+'ga o'tish",
      planId: "pro_plus",
      priceNum: 24990,
      popular: true,
    },
  ];

  return (
    <div className="py-24 min-h-screen">
      <div className="text-center mb-16 px-4">
        <h1 className="text-4xl md:text-5xl font-black dark:text-white mb-4 tracking-tighter uppercase">
          Tarifingizni yangilang
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto font-medium">
          Thinky bilan o'qishda yangi marralarni zabt eting.
        </p>

        {/* Refill Credits CTA */}
        <div className="mt-12 inline-flex items-center gap-6 p-2 pr-6 bg-brandA/5 rounded-3xl border border-brandA/10 animate-in fade-in slide-in-from-top duration-700">
           <div className="w-12 h-12 bg-brandA text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-brandA/20 animate-pulse">
              <FiZap />
           </div>
           <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest text-brandA">Kreditlar tugadimi?</p>
              <p className="text-[10px] font-bold text-slate-500">Tarifingizni o'zgartirmasdan kredit sotib oling</p>
           </div>
           <button 
             onClick={() => router.push("/buy-credits")}
             className="ml-4 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
           >
              Kredit olish
           </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch mb-24 px-6">
        {tiers.map((tier) => {
          const isCurrentPlan = user?.planType === tier.planId || (!user?.planType && tier.planId === "free");
          
          return (
            <div
              key={tier.name}
              className={`flex flex-col p-10 rounded-[3rem] transition-all duration-500 border-2 ${
                tier.popular 
                  ? "bg-slate-900 border-brandA shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] text-white scale-105" 
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
              }`}
            >
              {tier.popular && (
                <div className="mb-6">
                  <span className="bg-brandA text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-brandA/30">
                    Eng Mashhur
                  </span>
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-3xl font-black mb-3 tracking-tighter uppercase">{tier.name}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{tier.description}</p>
              </div>
              
              <div className="mb-10">
                <span className="text-5xl font-black tracking-tighter">{tier.price}</span>
                <span className="text-slate-400 text-sm ml-2 font-bold uppercase tracking-widest"> UZS / oy</span>
              </div>
              
              <div className="flex-grow flex flex-col justify-between">
                <ul className="space-y-5 mb-12">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${tier.popular ? "bg-brandA text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={tier.popular ? "text-slate-300" : "text-slate-500"}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.planId, tier.priceNum)}
                  disabled={loading === tier.planId || isCurrentPlan || tier.priceNum === 0}
                  className={`w-full py-5 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all ${
                    isCurrentPlan
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                      : tier.popular
                        ? "bg-brandA text-white hover:bg-brandA/90 shadow-2xl shadow-brandA/40 scale-[1.02] active:scale-95"
                        : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-95 shadow-xl"
                  }`}
                >
                  {isCurrentPlan ? "Joriy Tarif" : (loading === tier.planId ? "Kutilmoqda..." : tier.buttonText)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="max-w-5xl mx-auto px-6 mb-24">
        <h2 className="text-4xl font-black mb-12 text-center tracking-tighter uppercase">Imkoniyatlar jadvali</h2>
        <div className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl shadow-black/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                <th className="p-8 font-black uppercase tracking-widest text-xs">Xizmatlar</th>
                <th className="p-8 font-black uppercase tracking-widest text-xs text-center">Bepul</th>
                <th className="p-8 font-black uppercase tracking-widest text-xs text-center text-brandA">Pro</th>
                <th className="p-8 font-black uppercase tracking-widest text-xs text-center text-brandB">Pro+</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50 dark:divide-slate-900">
              {features.map((f, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="p-8 text-sm font-black uppercase tracking-widest text-slate-500">{f.name}</td>
                  <td className="p-8 text-center text-sm font-bold">
                    {typeof f.free === "string" ? f.free : (f.free ? <FiCheckCircle className="inline text-emerald-500" /> : "—")}
                  </td>
                  <td className="p-8 text-center text-sm font-black text-brandA">
                    {typeof f.pro === "string" ? f.pro : (f.pro ? <FiCheckCircle className="inline text-brandA" /> : "—")}
                  </td>
                  <td className="p-8 text-center text-sm font-black text-brandB">
                    {typeof f.pro_plus === "string" ? f.pro_plus : (f.pro_plus ? <FiCheckCircle className="inline text-brandB" /> : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Section */}
      <div className="max-w-4xl mx-auto text-center px-6 mb-12">
        <div className="p-16 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-brandA/5 dark:to-brandB/5 rounded-[4rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brandA blur-[100px] opacity-10" />
          <h3 className="text-4xl font-black text-white mb-6 tracking-tighter uppercase">Savollaringiz bormi?</h3>
          <p className="text-slate-400 mb-12 text-lg font-medium max-w-2xl mx-auto">
            Bizning jamoamiz har doim yordamga tayyor. Har qanday masala bo'yicha bizga murojaat qiling.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => setShowSupport(true)}
              className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform"
            >
              Murojaat yuborish
            </button>
            <a 
              href="https://t.me/thinky_help" 
              target="_blank"
              className="px-10 py-5 bg-brandA text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform flex items-center gap-3"
            >
              Telegram Admin
            </a>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[3rem] p-12 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase">Support</h2>
            <p className="text-slate-500 text-sm mb-8 font-medium">Xabar qoldiring, tez orada javob beramiz.</p>
            <textarea 
              className="input min-h-[150px] mb-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 ring-brandA/20" 
              placeholder="Muammo yoki taklif..."
              value={supportMsg}
              onChange={e => setSupportMsg(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowSupport(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-xs">Yopish</button>
              <button onClick={handleSupport} className="flex-[2] py-4 bg-brandA text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-brandA/20">Yuborish</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-950 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-200">
            
            {isPaid ? (
              <div className="flex flex-col items-center text-center py-4 animate-in slide-in-from-bottom duration-500">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-3xl shadow-xl mb-4 animate-bounce">
                  ✓
                </div>
                <h2 className="text-xl font-black mb-1 tracking-tighter uppercase">{t("processSuccess")}!</h2>
                <p className="text-[11px] text-slate-500 mb-6 font-medium">
                  {paymentInfo?.plan?.toUpperCase()} tarifingiz faollashtirildi. 
                </p>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 animate-[progress_3s_linear]" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-black tracking-tighter uppercase">{t("pricingTitle")}</h2>
                  <p className="text-red-500 text-[10px] font-black leading-relaxed mt-2 uppercase">
                    {t("paymentInstructions")}
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Promo + Rewards */}
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[7px] text-slate-400 font-black uppercase mb-2 tracking-widest">Promo code</p>
                      <div className="flex gap-2">
                        <input
                          className="input py-2 px-3 text-xs"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder=""
                        />
                        <button onClick={validatePromo} className="px-4 rounded-xl bg-brandA/10 text-brandA font-black text-[9px] uppercase tracking-widest">
                          Apply
                        </button>
                      </div>
                      {promoInfo && (
                        <p className="mt-2 text-[10px] font-bold text-green-600">
                          {promoInfo.code} (-{promoInfo.discountPercent}%)
                        </p>
                      )}
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">Use rewards</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">
                          Balans: {rewardsInfo?.rewardBalance?.toLocaleString() || user?.rewardBalance?.toLocaleString() || 0} UZS
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const next = !useRewards;
                          setUseRewards(next);
                          if (paymentInfo) handleSubscribe(paymentInfo.plan, paymentInfo.originalAmount, next);
                        }}
                        className={`w-12 h-7 rounded-full transition-all ${useRewards ? "bg-brandA" : "bg-slate-200 dark:bg-slate-800"} p-1`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-all ${useRewards ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      navigator.clipboard.writeText("5614682774034609");
                      toast.success(t("copied"));
                    }}
                    className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-[7px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">{t("cardNumber")}</p>
                      <p className="text-xs font-mono font-black tracking-widest text-slate-900 dark:text-white">
                        5614 6827 7403 4609
                      </p>
                    </div>
                    <span className="text-[10px] opacity-20 group-hover:opacity-100 text-slate-500"><FiCopy /></span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[7px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Miqdor</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {paymentInfo?.amount?.toLocaleString()} UZS
                      </p>
                    </div>
                    <div className="p-3.5 bg-brandA/5 rounded-xl border-2 border-dashed border-brandA/20 relative group">
                      <p className="text-[7px] text-brandA font-black uppercase mb-0.5 tracking-widest">{t("paymentCode")}</p>
                      <p className="text-xs font-mono font-black text-brandA">{paymentInfo?.code}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(paymentInfo?.code);
                          toast.success(t("copied"));
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[10px] opacity-30 hover:opacity-100"
                      >
                        <FiCopy />
                      </button>
                    </div>
                  </div>

                  {!isReceiptUploaded ? (
                    <div className="space-y-3 pt-1">
                      <div className="p-5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center hover:border-brandA transition-colors cursor-pointer group bg-slate-50/50 dark:bg-slate-900/30">
                        <input 
                          type="file" 
                          id="receipt-upload" 
                          className="hidden" 
                          onChange={handleFileChange}
                          accept="image/*,.pdf"
                        />
                        <label htmlFor="receipt-upload" className="cursor-pointer block">
                          <div className="text-2xl mb-1 group-hover:scale-110 transition-transform text-indigo-500 flex justify-center"><FiCamera /></div>
                          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                            {selectedFile ? selectedFile.name : t("choosePhoto")}
                          </p>
                        </label>
                      </div>
                      <button
                        onClick={handleUploadReceipt}
                        disabled={!selectedFile || isUploading}
                        className="btn-primary w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brandA/10 disabled:opacity-50"
                      >
                        {isUploading ? t("loading") : t("saveChanges")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="p-6 flex flex-col items-center justify-center bg-brandA/5 rounded-2xl border border-brandA/10 text-center">
                        <div className="w-8 h-8 border-3 border-brandA border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-[9px] font-black text-brandA uppercase tracking-widest mb-1">{t("waitAdmin")}</p>
                        <p className="text-[7px] text-slate-500 font-bold uppercase opacity-50">Admin tasdig'i kutilmoqda...</p>
                      </div>
                      <button 
                        onClick={async () => {
                          setCheckingStatus(true);
                          await startPolling(paymentInfo.code);
                          setTimeout(() => setCheckingStatus(false), 1000);
                        }}
                        disabled={checkingStatus}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                      >
                        {checkingStatus ? (
                          <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : <FiRefreshCw className="w-3 h-3" />} 
                        {t("loading")}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowModal(false);
                      localStorage.removeItem("activePayment");
                    }}
                    className="w-full py-2 text-slate-400 text-[8px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    YOPISH
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
