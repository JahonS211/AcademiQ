"use client";

import { API_BASE_URL } from "../../lib/config";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { presentationCreditCost } from "../../lib/creditCosts";
import { FiPieChart, FiZap, FiLayers, FiAlignLeft, FiDownload, FiPlus, FiTrash2 } from "react-icons/fi";
import CustomSelect from "../../components/CustomSelect";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";
import BackButton from "../../components/BackButton";

export default function PresentationsPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("uz");
  const [slideCount, setSlideCount] = useState(7);
  const [detailLevel, setDetailLevel] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [outline, setOutline] = useState(null);
  const [presentations, setPresentations] = useState([]);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const langOptions = [
    { value: "uz", label: "O'zbekcha" },
    { value: "ru", label: "Ruscha" },
    { value: "en", label: "English" },
  ];

  const slideOptions = [5, 7, 10, 12, 15].map((count) => ({ value: count, label: `${count} slayd` }));

  const detailOptions = [
    { value: "short", label: "Qisqa" },
    { value: "medium", label: "O'rtacha" },
    { value: "long", label: "Uzun" },
  ];

  const creditCost = presentationCreditCost(outline?.slides?.length || slideCount, detailLevel);
  const detailLabel = detailOptions.find((x) => x.value === detailLevel)?.label || "O'rtacha";

  const fetchPresentations = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/presentations`);
      setPresentations(data.presentations || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (ready) fetchPresentations();
  }, [ready]);

  const handlePlan = async () => {
    if (!topic.trim()) return toast.error(t("enterTopic"));
    setPlanning(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API_BASE_URL}/api/presentations/plan`,
        { topic, language, slideCount, detailLevel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOutline(data.outline);
      toast.success("Slayd rejasi tayyor. Xohlasangiz tahrirlang.");
    } catch (err) {
      const msg = err.response?.data?.message || "Reja yaratishda xatolik";
      if (msg.toLowerCase().includes("kredit") || msg.toLowerCase().includes("credit") || err.response?.data?.code === "UPGRADE_REQUIRED") {
        setShowCreditModal(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setPlanning(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error(t("enterTopic"));
    if (!outline) {
      await handlePlan();
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API_BASE_URL}/api/presentations/generate`,
        {
          topic,
          language,
          slideCount: outline.slides.length,
          detailLevel,
          title: outline.title,
          subtitle: outline.subtitle,
          slides: outline.slides,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t("generatedSuccess"));
      setTopic("");
      setOutline(null);
      syncUserCredits(data.remainingCredits);
      fetchPresentations();
      window.open(`${API_BASE_URL}${data.presentation.fileUrl}`, "_blank");
    } catch (err) {
      const msg = err.response?.data?.message || "Xatolik yuz berdi";
      if (msg.toLowerCase().includes("kredit") || msg.toLowerCase().includes("credit")) {
        setShowCreditModal(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSlide = (index, field, value) => {
    setOutline((current) => {
      if (!current) return current;
      const slides = current.slides.map((slide, slideIndex) => (
        slideIndex === index ? { ...slide, [field]: value } : slide
      ));
      return { ...current, slides };
    });
  };

  const updateSlideContent = (index, value) => {
    updateSlide(index, "content", value.split("\n").map((line) => line.trim()).filter(Boolean));
  };

  const addSlide = () => {
    setOutline((current) => {
      if (!current || current.slides.length >= 15) return current;
      const nextNumber = current.slides.length + 1;
      return {
        ...current,
        slides: [
          ...current.slides,
          {
            id: `${Date.now()}-${nextNumber}`,
            title: `Yangi slayd ${nextNumber}`,
            takeaway: "Asosiy fikrni yozing",
            content: ["Muhim punktni yozing", "Misol yoki izoh qo'shing", "Xulosa kiriting"],
            imageDesc: "Slaydga mos vizual tavsifi",
            imageSearchQuery: `${topic} educational visual`,
            visualKeywords: [topic, "education", "visual"],
            speakerNote: "",
          },
        ],
      };
    });
  };

  const removeSlide = (index) => {
    setOutline((current) => {
      if (!current || current.slides.length <= 3) return current;
      return { ...current, slides: current.slides.filter((_, slideIndex) => slideIndex !== index) };
    });
  };

  if (!ready) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 px-4">
      <BackButton fallback="/tools" />
      <div className="card p-6 md:p-8 bg-white dark:bg-slate-900 border-none shadow-xl relative overflow-visible">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              <FiPieChart />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-tight">{t("presentationsTitle")}</h1>
              <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.2em]">AI Slide Creation</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium max-w-xl lg:text-right">{t("presentationsDesc")}</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mavzu</label>
            <input
              className="input w-full min-h-[58px] py-4 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-4 ring-brandA/10 font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              placeholder={t("topicPlaceholder")}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_auto] items-end">
            <CustomSelect value={language} onChange={setLanguage} options={langOptions} label="Til" />
            <CustomSelect value={slideCount} onChange={setSlideCount} options={slideOptions} label="Slayd" />
            <CustomSelect value={detailLevel} onChange={setDetailLevel} options={detailOptions} label="Ma'lumot" />
            <button
              disabled={loading || planning}
              onClick={handleGenerate}
              className="min-h-[56px] px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap md:col-span-3 xl:col-span-1"
            >
              {(loading || planning) ? t("loading") : (
                <>
                  <span>{outline ? t("generate") : "Reja yaratish"}</span>
                  <FiZap className="text-amber-400" />
                  <span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg text-[9px] font-black tracking-tight uppercase">{creditCost} {t("credits")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 grid md:grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2"><FiLayers /> Slayd soni: {outline?.slides?.length || slideCount}</div>
          <div className="flex items-center gap-2"><FiAlignLeft /> Matn uzunligi: {detailLabel}</div>
        </div>
      </div>

      {outline && (
        <div className="card p-6 md:p-8 bg-white dark:bg-slate-900 border-none shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-500">Gamma-style reja</p>
              <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1">Slaydlar tarkibini tahrirlang</h2>
              <p className="text-sm font-semibold text-slate-500 mt-1">Har slayd matni va rasm tavsifini o'zingizga moslab o'zgartiring.</p>
            </div>
            <button
              onClick={addSlide}
              disabled={outline.slides.length >= 15}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-40"
            >
              <FiPlus /> Slayd qo'shish
            </button>
          </div>

          <div className="space-y-4">
            {outline.slides.map((slide, index) => (
              <div key={slide.id || index} className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    {index + 1}-slayd
                  </span>
                  <button
                    onClick={() => removeSlide(index)}
                    disabled={outline.slides.length <= 3}
                    className="rounded-xl bg-rose-500/10 p-2 text-rose-500 disabled:opacity-30"
                    title="Slaydni o'chirish"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="input rounded-2xl border-none bg-white px-4 py-3 text-sm font-bold dark:bg-slate-900"
                    value={slide.title}
                    onChange={(e) => updateSlide(index, "title", e.target.value)}
                    placeholder="Slayd sarlavhasi"
                  />
                  <input
                    className="input rounded-2xl border-none bg-white px-4 py-3 text-sm font-bold dark:bg-slate-900"
                    value={slide.takeaway}
                    onChange={(e) => updateSlide(index, "takeaway", e.target.value)}
                    placeholder="Asosiy fikr"
                  />
                  <textarea
                    className="input min-h-[120px] rounded-2xl border-none bg-white px-4 py-3 text-sm font-semibold leading-6 dark:bg-slate-900 md:col-span-2"
                    value={(slide.content || []).join("\n")}
                    onChange={(e) => updateSlideContent(index, e.target.value)}
                    placeholder="Har punktni alohida qatorda yozing"
                  />
                  <input
                    className="input rounded-2xl border-none bg-white px-4 py-3 text-sm font-bold dark:bg-slate-900 md:col-span-2"
                    value={slide.imageDesc}
                    onChange={(e) => updateSlide(index, "imageDesc", e.target.value)}
                    placeholder="Bu slayd uchun rasm qanday bo'lsin?"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? t("loading") : `Prezentatsiyani yaratish - ${presentationCreditCost(outline.slides.length, detailLevel)} ${t("credits")}`}
          </button>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-black tracking-tighter uppercase ml-1">{t("myPresentations")}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presentations.map((item) => (
            <div key={item._id} className="card p-6 flex flex-col hover:shadow-xl transition-all border-none bg-white dark:bg-slate-900">
              <div className="mb-4 text-3xl text-indigo-600 dark:text-indigo-400"><FiPieChart /></div>
              <h3 className="font-bold text-sm mb-2 line-clamp-2 uppercase tracking-tight">{item.title}</h3>
              <p className="text-[10px] text-slate-400 uppercase font-black mb-6 tracking-widest">{item.category}</p>
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-bold">{new Date(item.createdAt).toLocaleDateString()}</span>
                <a href={`${API_BASE_URL}${item.fileUrl}`} target="_blank" className="text-brandA font-black text-[10px] uppercase tracking-widest hover:underline inline-flex items-center gap-1">
                  {t("download")} <FiDownload />
                </a>
              </div>
            </div>
          ))}
          {presentations.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem]">
              {t("noPresentations")}
            </div>
          )}
        </div>
      </div>
      <InsufficientCreditsModal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} />
    </div>
  );
}
