"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { FiFileText, FiZap, FiAward, FiGlobe, FiTrash2 } from "react-icons/fi";
import CustomSelect from "../../components/CustomSelect";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";

export default function TestsPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [topic, setTopic] = useState("");
  const [test, setTest] = useState(null);
  const [language, setLanguage] = useState("uz");
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const langOptions = [
    { value: "uz", label: "O'zbekcha" },
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" },
  ];

  const countOptions = [
    { value: 5, label: "5 savol" },
    { value: 10, label: "10 savol" },
    { value: 15, label: "15 savol" },
    { value: 20, label: "20 savol" },
  ];

  const handleClear = () => {
    setTopic("");
    setTest(null);
    setResults(null);
    setUserAnswers({});
    setQuestionCount(10);
  };

  const handleGenerate = async () => {
    if (!topic) return toast.error(t("topicRequired"));
    setLoading(true);
    setTest(null);
    setResults(null);
    setUserAnswers({});
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post("https://academiq-production-0920.up.railway.app//api/tests/generate", 
        { topic, language, questionCount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTest(data.test);
      syncUserCredits(data.remainingCredits);
    } catch (err) {
      const msg = err.response?.data?.message || t("generateFailed");
      if (msg.toLowerCase().includes("kredit") || msg.toLowerCase().includes("credit")) {
        setShowCreditModal(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qIdx, oIdx) => {
    setUserAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmit = () => {
    let score = 0;
    test.questions.forEach((q, idx) => {
      const selectedIdx = userAnswers[idx];
      const correctIdx = q.options.findIndex(opt => opt === q.answer) !== -1 
        ? q.options.findIndex(opt => opt === q.answer)
        : q.answer.charCodeAt(0) - 65; // Fallback to A,B,C,D letters
      
      if (selectedIdx === correctIdx) score++;
    });
    setResults({
      score,
      total: test.questions.length,
      percentage: Math.round((score / test.questions.length) * 100)
    });
  };

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {!test ? (
        <div className="card p-10 text-center border-none bg-white dark:bg-slate-900 shadow-xl relative overflow-visible">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brandA/5 rounded-full -mr-8 -mt-8 blur-2xl" />
          <div className="text-4xl mb-6 text-indigo-600 dark:text-indigo-400"><FiFileText className="mx-auto" /></div>
          <h1 className="text-2xl font-black mb-2 uppercase tracking-tighter">{t("testsTitle")}</h1>
          <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm font-medium">
            {t("testsDesc")}
          </p>
          
          <div className="flex flex-col md:flex-row gap-3 max-w-3xl mx-auto">
            <input 
              className="input flex-1 py-4 px-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 ring-brandA/20 font-bold text-sm" 
              placeholder={t("topicPlaceholder")} 
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
            <div className="w-full md:w-40 relative z-50">
              <CustomSelect 
                value={language}
                onChange={setLanguage}
                options={langOptions}
                icon={<FiGlobe />}
              />
            </div>
            <div className="w-full md:w-40 relative z-50">
              <CustomSelect
                value={questionCount}
                onChange={setQuestionCount}
                options={countOptions}
              />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2 group"
            >
              {loading ? t("loading") : (
                <>
                  <span>{t("generate")}</span>
                  <FiZap className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                  <span className="ml-2 px-2.5 py-1 bg-indigo-500 text-white rounded-lg text-[9px] font-black tracking-tighter uppercase">5 {t("credits")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <h1 className="text-xl font-black tracking-tighter uppercase">{test.title}</h1>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-500 transition-colors"
            >
              <FiTrash2 />
              Tozalash
            </button>
          </div>

          <div className="space-y-4">
            {test.questions.map((q, idx) => (
              <div key={idx} className="card p-6 bg-white dark:bg-slate-900 border-none shadow-lg">
                <p className="text-sm font-black mb-6 flex gap-4">
                  <span className="text-brandA">{idx + 1}.</span>
                  {q.question}
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = userAnswers[idx] === oIdx;
                    const correctIdx = q.options.findIndex(o => o === q.answer) !== -1 
                      ? q.options.findIndex(o => o === q.answer)
                      : q.answer.charCodeAt(0) - 65;
                    
                    const isCorrect = results && oIdx === correctIdx;
                    const isWrong = results && isSelected && oIdx !== correctIdx;
                    
                    return (
                      <motion.button
                        key={oIdx}
                        whileHover={!results ? { scale: 1.01, x: 5 } : {}}
                        whileTap={!results ? { scale: 0.98 } : {}}
                        onClick={() => !results && handleAnswer(idx, oIdx)}
                        className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-300 flex items-center justify-between ${
                          isSelected 
                            ? "border-brandA bg-brandA/5 shadow-md" 
                            : "border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-200"
                        } ${
                          isCorrect ? "!border-green-500 bg-green-50/50 dark:bg-green-500/10 !text-green-600" : ""
                        } ${
                          isWrong ? "!border-red-500 bg-red-50/50 dark:bg-red-500/10 !text-red-600" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors ${
                            isSelected ? "bg-brandA text-white" : "bg-white dark:bg-slate-800 text-slate-400 group-hover:bg-slate-100"
                          } ${isCorrect ? "bg-green-500 text-white" : ""} ${isWrong ? "bg-red-500 text-white" : ""}`}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span className="font-bold text-xs tracking-tight">{opt}</span>
                        </div>
                        
                        {isSelected && !results && (
                          <motion.div 
                            layoutId={`indicator-${idx}`}
                            className="w-1.5 h-1.5 rounded-full bg-brandA"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!results ? (
            <div className="flex justify-center pt-6">
              <button 
                onClick={handleSubmit}
                className="px-16 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                {t("finishTest")}
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card p-10 text-center border-none bg-brandA/5 shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-brandA/10 rounded-full blur-3xl" />
               <div className="text-5xl mb-4 text-emerald-500 flex justify-center"><FiAward /></div>
               <h2 className="text-2xl font-black mb-1 uppercase tracking-tighter">{t("testResult")}</h2>
               <p className="text-6xl font-black text-brandA my-6 tracking-tighter">{results.score} / {results.total}</p>
               <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{t("score")}: {results.percentage}%</p>
               <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                 <button 
                  onClick={() => {
                    setTest(null);
                    setResults(null);
                    setUserAnswers({});
                  }}
                  className="px-12 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px]"
                 >
                   {t("newTest")}
                 </button>
                 <button 
                  onClick={handleClear}
                  className="px-12 py-4 bg-rose-500/10 text-rose-500 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                 >
                   <FiTrash2 />
                   Tozalash
                 </button>
               </div>
            </motion.div>
          )}
        </div>
      )}
      <InsufficientCreditsModal 
        isOpen={showCreditModal} 
        onClose={() => setShowCreditModal(false)} 
      />
    </div>
  );
}
