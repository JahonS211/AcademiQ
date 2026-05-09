"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { FiSend, FiZap, FiMessageSquare, FiGlobe, FiPlus, FiLock, FiChevronRight } from "react-icons/fi";
import CustomSelect from "../../components/CustomSelect";

const safeParseJSON = (value, fallback = {}) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_) {
    return fallback;
  }
};

// Simple markdown renderer with VS Code-style code blocks
function MarkdownRenderer({ text }) {
  if (!text) return null;

  const renderLine = (line, i) => {
    if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-black uppercase tracking-widest text-brandA mt-4 mb-2">{line.slice(4)}</h3>;
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
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 text-[12px] font-mono overflow-x-auto leading-relaxed">
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

export default function ChatPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("uz");
  const [loading, setLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const scrollRef = useRef(null);

  const langOptions = [
    { value: "uz", label: "O'zbekcha" },
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" },
  ];

  const [history, setHistory] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setCurrentUser(safeParseJSON(localStorage.getItem("user"), {}));
  }, [ready]);

  // Load from session storage
  useEffect(() => {
    const savedHistory = sessionStorage.getItem("academiq_chat_sessions");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
        if (parsed.length > 0) {
          const lastSession = parsed[0];
          setMessages(lastSession.messages);
          setActiveSessionId(lastSession.id);
        }
      } catch (e) {
        sessionStorage.removeItem("academiq_chat_sessions");
      }
    }
  }, []);

  // Save to session storage
  useEffect(() => {
    if (activeSessionId) {
      const updatedHistory = history.map(s => 
        s.id === activeSessionId ? { ...s, messages } : s
      );
      if (history.find(s => s.id === activeSessionId)) {
        setHistory(updatedHistory);
        sessionStorage.setItem("academiq_chat_sessions", JSON.stringify(updatedHistory));
      } else if (messages.length > 0) {
         const newSession = { 
           id: activeSessionId, 
           title: messages[0]?.text?.slice(0, 30) || "Yangi Chat",
           messages 
         };
         const finalHistory = [newSession, ...history];
         setHistory(finalHistory);
         sessionStorage.setItem("academiq_chat_sessions", JSON.stringify(finalHistory));
      }
    }
  }, [messages]);

  const startNewChat = () => {
    if (messages.length > 0) {
      const newId = Date.now();
      setActiveSessionId(newId);
      setMessages([]);
    }
    toast.success("Yangi chat boshlandi");
    setIsHistoryOpen(false);
  };

  const switchSession = (id) => {
    const session = history.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages(session.messages);
      setIsHistoryOpen(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    if (!activeSessionId) setActiveSessionId(Date.now());

    const userMsg = { role: "user", text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post("http://localhost:5000/api/chat", {
        message: currentInput,
        language: language,
        history: messages.slice(-10) 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!data.success) {
        if (data.code === "UPGRADE_REQUIRED") {
          toast.error("Tarifingizni yangilang!");
          return;
        }
        toast.error(data.message || "AI javobi qaytarilmadi");
        return;
      }

      setMessages(prev => [...prev, { role: "ai", text: data.response }]);
      
      if (data.remainingCredits != null) {
        syncUserCredits(data.remainingCredits);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !currentUser) return null;

  // Plan Check (Extra security if they bypass sidebar)
  const user = currentUser;
  if (user.role !== "admin" && (user.planType === "free" || !user.planType)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-brandA/10 text-brandA rounded-[2.5rem] flex items-center justify-center text-4xl shadow-xl">
           <FiLock />
        </div>
        <div>
           <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Premium Xizmat</h1>
           <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest max-w-sm mx-auto">
             AI Chat xizmatidan foydalanish uchun PRO yoki PRO+ tariflaridan biriga o'tishingiz kerak.
           </p>
        </div>
        <button 
          onClick={() => window.location.href = "/pricing"}
          className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-105 transition-all"
        >
          Tarifni Yangilash
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 max-w-6xl mx-auto py-2 overflow-hidden relative">
      {/* Mobile History Sidebar Overlay */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsHistoryOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* History Sidebar */}
      <motion.div 
        initial={false}
        animate={{ 
          x: isHistoryOpen ? 0 : (isMobile ? "-100%" : 0),
          width: isHistoryOpen ? (isMobile ? 288 : 256) : 0,
          opacity: isHistoryOpen ? 1 : 0,
          marginLeft: isHistoryOpen ? 0 : (isMobile ? 0 : -16)
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          shrink-0 bg-white dark:bg-slate-900 
          p-6 shadow-2xl md:shadow-xl overflow-hidden
          rounded-r-[2rem] md:rounded-[2rem] border-r md:border border-slate-100 dark:border-slate-800 flex flex-col
        `}
      >
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chat Tarixi</h3>
           <div className="flex gap-2">
             <button onClick={startNewChat} className="p-2.5 bg-brandA/10 text-brandA rounded-xl hover:bg-brandA/20 transition-colors">
                <FiPlus className="w-4 h-4" />
             </button>
             <button onClick={() => setIsHistoryOpen(false)} className="md:hidden p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <FiChevronRight className="w-4 h-4" />
             </button>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
           {history.map((s) => (
             <button
               key={s.id}
               onClick={() => switchSession(s.id)}
               className={`w-full text-left p-4 rounded-2xl text-[11px] font-bold transition-all border ${
                 activeSessionId === s.id 
                   ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20" 
                   : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-transparent hover:border-slate-200"
               }`}
             >
               <p className="truncate">{s.title}</p>
             </button>
           ))}
           {history.length === 0 && (
             <div className="text-center py-10 opacity-30">
                <FiMessageSquare className="mx-auto mb-2 opacity-50" />
                <p className="text-[9px] font-black uppercase tracking-widest">Tarix bo'sh</p>
             </div>
           )}
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col h-full min-w-0 px-2 md:px-0">
        {/* Header */}
        <div className="card p-4 mb-4 flex items-center justify-between border-none shadow-lg bg-white dark:bg-slate-900 overflow-visible relative">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg active:scale-90 transition-all ${isHistoryOpen ? "bg-slate-900 text-white" : "bg-brandA text-white shadow-brandA/20"}`}
              title={isHistoryOpen ? "Tarixni yopish" : "Tarixni ochish"}
            >
              <img src="/logo.png" className="w-6 h-6 object-contain brightness-0 invert" alt="AcademiQ" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm md:text-lg font-black tracking-tighter uppercase truncate max-w-[160px] md:max-w-none">AcademiQ AI Assistant</h1>
              <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest">Active • AI Models On</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-24 md:w-32">
              <CustomSelect 
                options={langOptions}
                value={language}
                onChange={setLanguage}
                icon={<FiGlobe />}
              />
            </div>
            <div className="hidden xs:flex px-2 md:px-3 py-1.5 bg-brandA/10 text-brandA rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest items-center gap-1.5">
              <FiZap className="animate-pulse" /> 1 Credit
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto no-scrollbar space-y-6 px-1 md:px-2 pb-6"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-4">
               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4 shadow-xl">
                  👋
               </div>
               <h3 className="text-lg font-black uppercase tracking-tightest mb-1">Xush kelibsiz!</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Qanday yordam bera olaman?</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[92%] md:max-w-[85%] p-4 md:p-5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm break-words ${
                  msg.role === "user" 
                    ? "bg-slate-900 text-white rounded-br-none shadow-lg shadow-slate-900/10 ml-auto" 
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-none"
                }`}>
                  {msg.role === "ai" ? (
                    <div className="overflow-x-hidden">
                      <MarkdownRenderer text={msg.text} />
                    </div>
                  ) : (
                    <p className="whitespace-pre-line break-words">{msg.text}</p>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-800 shadow-sm flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-brandA rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-brandA rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-brandA rounded-full animate-bounce" />
                  <span className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest">AI o'ylamoqda...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="mt-2 md:mt-4 relative">
          <input 
            className="w-full py-4 md:py-5 pl-5 md:pl-7 pr-14 md:pr-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-2xl shadow-brandA/5 focus:ring-4 ring-brandA/10 font-medium text-sm placeholder:opacity-40 transition-all outline-none"
            placeholder="Savolingizni yozing..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 bg-slate-900 dark:bg-brandA text-white rounded-full flex items-center justify-center text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-10 shadow-lg"
          >
            <FiSend className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
