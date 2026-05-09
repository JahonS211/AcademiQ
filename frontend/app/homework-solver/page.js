"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { FiZap, FiBookOpen, FiCopy, FiCheck, FiTrash2 } from "react-icons/fi";
import CustomSelect from "../../components/CustomSelect";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";

// Simple markdown renderer with VS Code-style code blocks
function MarkdownRenderer({ text }) {
  if (!text) return null;

  const renderLine = (line, i) => {
    // Code block already handled at block level
    if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-black uppercase tracking-widest text-amber-500 mt-4 mb-2">{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-base font-black uppercase tracking-widest mt-4 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={i} className="text-lg font-black uppercase tracking-widest mt-4 mb-2">{line.slice(2)}</h1>;
    if (line === "---" || line === "***") return <hr key={i} className="border-slate-200 dark:border-slate-700 my-3" />;
    if (line.trim() === "") return <div key={i} className="h-2" />;

    // Inline bold/code
    const rendered = line
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>')
      .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded text-[12px] font-mono">$1</code>');
    return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: rendered }} />;
  };

  // Split into blocks (handle fenced code blocks)
  const blocks = [];
  const lines = text.split("\n");
  let inCode = false;
  let codeLang = "";
  let codeLines = [];
  let normalLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (!inCode) {
        if (normalLines.length) { blocks.push({ type: "normal", lines: [...normalLines] }); normalLines = []; }
        inCode = true;
        codeLang = line.slice(3).trim() || "code";
        codeLines = [];
      } else {
        blocks.push({ type: "code", lang: codeLang, lines: [...codeLines] });
        inCode = false; codeLang = ""; codeLines = [];
      }
    } else if (inCode) {
      codeLines.push(line);
    } else {
      normalLines.push(line);
    }
  }
  if (normalLines.length) blocks.push({ type: "normal", lines: normalLines });
  if (codeLines.length) blocks.push({ type: "code", lang: codeLang, lines: codeLines });

  return (
    <div className="space-y-1">
      {blocks.map((block, bi) => {
        if (block.type === "code") {
          return (
            <div key={bi} className="rounded-xl overflow-hidden border border-slate-700 my-3">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{block.lang}</span>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-300 text-[13px] font-mono overflow-x-auto leading-relaxed">
                <code>{block.lines.join("\n")}</code>
              </pre>
            </div>
          );
        }
        return <div key={bi} className="space-y-1">{block.lines.map(renderLine)}</div>;
      })}
    </div>
  );
}

export default function HomeworkSolverPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("Math");
  const [language, setLanguage] = useState("uz");
  const [solution, setSolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const handleSolve = async () => {
    if (!question.trim()) return toast.error(t("enterQuestion") || "Savolni kiriting!");
    setLoading(true);
    setSolution("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post("https://academiq-production-0920.up.railway.app//api/homework-solver", {
        question, subject, language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!data.success) return toast.error(data.message || "Xatolik");
      setSolution(data.solution);
      if (data.remainingCredits != null) syncUserCredits(data.remainingCredits);
      toast.success(t("generatedSuccess"));
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

  const handleCopy = () => {
    navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setQuestion("");
    setSolution("");
    setCopied(false);
  };

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl relative overflow-visible">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-10 -mt-10 blur-3xl" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 text-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-amber-500/10">
            <FiBookOpen />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Homework Solver</h1>
            <p className="text-slate-500 font-bold uppercase text-[8px] tracking-[0.2em]">AI • {t("studyTool")} • Avtomatik til aniqlash</p>
          </div>
        </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div className="w-full md:w-1/2 relative z-[60]">
              <CustomSelect 
                label={t("subject")}
                value={subject}
                onChange={val => setSubject(val)}
                options={[
                  { value: "Math", label: t("math") },
                  { value: "Physics", label: t("physics") },
                  { value: "Chemistry", label: t("chemistry") },
                  { value: "English", label: t("english") },
                  { value: "History", label: t("history") },
                  { value: "IT", label: "Informatika (IT)" },
                  { value: "Literature", label: "Ona tili va adabiyot" },
                  { value: "Other", label: t("other") }
                ]}
              />
            </div>
            <div className="w-full md:w-1/2 relative z-[60]">
              <CustomSelect 
                label={t("language")}
                value={language}
                onChange={val => setLanguage(val)}
                options={[
                  { value: "uz", label: "O'zbekcha" },
                  { value: "ru", label: "Русский" },
                  { value: "en", label: "English" }
                ]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t("taskText") || "Vazifa matni"}</label>
            <textarea 
              className="input h-40 py-4 px-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 ring-amber-500/20 text-sm font-medium leading-relaxed resize-none w-full" 
              placeholder={t("taskPlaceholder") || "Vazifani kiriting..."} 
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleSolve()}
            />
            <p className="text-[9px] text-slate-400 ml-1">Ctrl+Enter — yuborish</p>
          </div>

          <button 
            onClick={handleSolve} 
            disabled={loading}
            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-500/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t("solving")}
              </>
            ) : (
              <>
                <FiZap className="group-hover:rotate-12 transition-transform" />
                <span>{t("solveTask")}</span>
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-[8px]">5 {t("credits").toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

      <AnimatePresence>
        {solution && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-white dark:bg-slate-900 border-none shadow-xl overflow-hidden"
          >
            {/* Header bar like VS Code */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t("solutionExplanation")}</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[9px] text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-widest"
                >
                  {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                  {copied ? "Nusxalandi!" : "Nusxa olish"}
                </button>
                <button 
                  onClick={handleClear}
                  className="flex items-center gap-1.5 text-[9px] text-rose-300 hover:text-rose-100 transition-colors font-bold uppercase tracking-widest"
                >
                  <FiTrash2 />
                  Tozalash
                </button>
              </div>
            </div>
            <div className="p-6 text-slate-700 dark:text-slate-300">
              <MarkdownRenderer text={solution} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <InsufficientCreditsModal 
        isOpen={showCreditModal} 
        onClose={() => setShowCreditModal(false)} 
      />
    </div>
  );
}
