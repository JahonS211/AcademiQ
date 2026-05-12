"use client";

import { API_BASE_URL } from "../../lib/config";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { toolBaseCosts } from "../../lib/creditCosts";
import { FiChevronRight, FiImage, FiMessageSquare, FiPlus, FiSend, FiX, FiZap } from "react-icons/fi";
import CustomSelect from "../../components/CustomSelect";
import MathInline from "../../components/MathInline";

const safeParseJSON = (value, fallback = {}) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_) {
    return fallback;
  }
};

const renderInline = (text, keyPrefix) => {
  const parts = String(text).split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${keyPrefix}-${index}`} className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded text-[12px] font-mono">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${index}`} className="font-black text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    return <MathInline key={`${keyPrefix}-${index}`} text={part} keyPrefix={`${keyPrefix}-${index}`} />;
  });
};

function MarkdownRenderer({ text }) {
  if (!text) return null;

  const blocks = [];
  const lines = text.split("\n");
  let inCode = false;
  let codeLang = "code";
  let codeLines = [];
  let normalLines = [];

  const flushNormal = () => {
    if (normalLines.length) {
      blocks.push({ type: "normal", lines: normalLines });
      normalLines = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCode) {
        flushNormal();
        inCode = true;
        codeLang = line.slice(3).trim() || "code";
        codeLines = [];
      } else {
        blocks.push({ type: "code", lang: codeLang, lines: codeLines });
        inCode = false;
        codeLang = "code";
        codeLines = [];
      }
    } else if (inCode) {
      codeLines.push(line);
    } else {
      normalLines.push(line);
    }
  }

  flushNormal();
  if (codeLines.length) blocks.push({ type: "code", lang: codeLang, lines: codeLines });

  const renderLine = (line, index) => {
    if (line.startsWith("### ")) return <h3 key={index} className="text-sm font-black uppercase tracking-widest text-brandA mt-4 mb-2">{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={index} className="text-base font-black uppercase tracking-widest mt-4 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={index} className="text-lg font-black uppercase tracking-widest mt-4 mb-2">{line.slice(2)}</h1>;
    if (line.trim() === "") return <div key={index} className="h-2" />;
    if (line.trim().startsWith("- ")) return <p key={index} className="text-sm leading-relaxed pl-3 border-l-2 border-brandA/30">{renderInline(line.trim().slice(2), index)}</p>;
    return <p key={index} className="text-sm leading-relaxed">{renderInline(line, index)}</p>;
  };

  return (
    <div className="space-y-1">
      {blocks.map((block, blockIndex) => {
        if (block.type === "code") {
          return (
            <div key={blockIndex} className="rounded-xl overflow-hidden border border-slate-700 my-3">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{block.lang}</span>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 text-[12px] font-mono overflow-x-auto leading-relaxed">
                <code>{block.lines.join("\n")}</code>
              </pre>
            </div>
          );
        }
        return <div key={blockIndex} className="space-y-1">{block.lines.map(renderLine)}</div>;
      })}
    </div>
  );
}

export default function ChatPage() {
  const ready = useRequireAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("uz");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageMode, setImageMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const langOptions = [
    { value: "uz", label: "O'zbekcha" },
    { value: "ru", label: "Ruscha" },
    { value: "en", label: "English" },
  ];

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

  useEffect(() => {
    const savedHistory = sessionStorage.getItem("thinky_chat_sessions");
    if (!savedHistory) return;

    try {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed);
      if (parsed.length > 0) {
        setMessages(parsed[0].messages || []);
        setActiveSessionId(parsed[0].id);
      }
    } catch (_) {
      sessionStorage.removeItem("thinky_chat_sessions");
    }
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;

    const exists = history.some((session) => session.id === activeSessionId);
    let nextHistory;

    if (exists) {
      nextHistory = history.map((session) => session.id === activeSessionId ? { ...session, messages } : session);
    } else if (messages.length > 0) {
      nextHistory = [{ id: activeSessionId, title: messages[0]?.text?.slice(0, 30) || "Yangi chat", messages }, ...history];
    } else {
      return;
    }

    setHistory(nextHistory);
    sessionStorage.setItem("thinky_chat_sessions", JSON.stringify(nextHistory));
  }, [messages, activeSessionId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const startNewChat = () => {
    setActiveSessionId(Date.now());
    setMessages([]);
    setIsHistoryOpen(false);
    toast.success("Yangi chat boshlandi");
  };

  const switchSession = (id) => {
    const session = history.find((item) => item.id === id);
    if (!session) return;
    setActiveSessionId(id);
    setMessages(session.messages || []);
    setIsHistoryOpen(false);
  };

  const sendMessage = async (event) => {
    if (event) event.preventDefault();
    if ((!input.trim() && !selectedImage) || loading) return;

    const currentInput = input.trim() || "Rasmni tahlil qilib bering";
    const imagePreview = selectedImage ? URL.createObjectURL(selectedImage) : null;
    const userMsg = {
      role: "user",
      text: imageMode ? `[AI rasm yaratish] ${currentInput}` : currentInput,
      imagePreview,
      imageName: selectedImage?.name || null,
    };
    const nextMessages = [...messages, userMsg];

    if (!activeSessionId) setActiveSessionId(Date.now());
    setMessages(nextMessages);
    setInput("");
    setSelectedImage(null);
    setImageMode(false);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const historyPayload = messages.slice(-10).map((item) => ({ role: item.role, text: item.text }));
      let response;

      if (selectedImage || imageMode) {
        const formData = new FormData();
        formData.append("message", currentInput);
        formData.append("language", language);
        formData.append("history", JSON.stringify(historyPayload));
        if (imageMode) formData.append("mode", "image");
        if (selectedImage) formData.append("image", selectedImage);
        response = await axios.post(`${API_BASE_URL}/api/chat`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/api/chat`, {
          message: currentInput,
          language,
          history: historyPayload,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const { data } = response;

      if (!data.success) {
        toast.error(data.message || "AI javobi qaytarilmadi");
        return;
      }

      setMessages((prev) => [...prev, {
        role: "ai",
        text: data.response,
        imageUrl: data.imageUrl ? `${API_BASE_URL}${data.imageUrl}` : null,
      }]);
      if (data.remainingCredits != null) syncUserCredits(data.remainingCredits);
    } catch (error) {
      const msg = error.response?.data?.message || "Xatolik yuz berdi";
      if (error.response?.data?.code === "UPGRADE_REQUIRED") toast.error("Bu xizmat uchun tarifni yangilang");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !currentUser) return null;

  const activeCost = imageMode ? toolBaseCosts.imageCreate : selectedImage ? toolBaseCosts.chatImage : toolBaseCosts.chat;

  return (
    <div className="chat-shell flex h-full min-h-0 gap-4 max-w-6xl mx-auto overflow-hidden relative">
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

      <motion.aside
        initial={false}
        animate={{
          x: isHistoryOpen ? 0 : (isMobile ? "-100%" : 0),
          width: isHistoryOpen ? (isMobile ? 288 : 256) : 0,
          opacity: isHistoryOpen ? 1 : 0,
          marginLeft: isHistoryOpen ? 0 : (isMobile ? 0 : -16),
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed md:relative inset-y-0 left-0 z-50 md:z-auto shrink-0 bg-white dark:bg-slate-900 p-6 shadow-2xl md:shadow-xl overflow-hidden rounded-r-[2rem] md:rounded-[2rem] border-r md:border border-slate-100 dark:border-slate-800 flex flex-col will-change-transform"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chat tarixi</h3>
          <div className="flex gap-2">
            <button onClick={startNewChat} className="p-2.5 bg-brandA/10 text-brandA rounded-xl hover:bg-brandA/20 transition-colors" title="Yangi chat">
              <FiPlus className="w-4 h-4" />
            </button>
            <button onClick={() => setIsHistoryOpen(false)} className="md:hidden p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl" title="Yopish">
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {history.map((session) => (
            <button
              key={session.id}
              onClick={() => switchSession(session.id)}
              className={`w-full text-left p-4 rounded-2xl text-[11px] font-bold transition-all border ${
                activeSessionId === session.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20"
                  : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-transparent hover:border-slate-200"
              }`}
            >
              <p className="truncate">{session.title}</p>
            </button>
          ))}
          {history.length === 0 && (
            <div className="text-center py-10 opacity-30">
              <FiMessageSquare className="mx-auto mb-2 opacity-50" />
              <p className="text-[9px] font-black uppercase tracking-widest">Tarix bo'sh</p>
            </div>
          )}
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col h-full min-h-0 min-w-0 px-0">
        <div className="card p-4 mb-4 shrink-0 flex items-center justify-between border-none shadow-lg bg-white dark:bg-slate-900 overflow-visible relative">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg active:scale-95 transition-all ${isHistoryOpen ? "bg-slate-900 text-white" : "bg-brandA text-white shadow-brandA/20"}`}
              title={isHistoryOpen ? "Tarixni yopish" : "Tarixni ochish"}
            >
              <FiMessageSquare className="w-5 h-5" />
            </button>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-sm md:text-lg font-black tracking-tight uppercase truncate max-w-[180px] md:max-w-none">Thinky AI Assistant</h1>
              <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest">Active - AI models on</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-24 md:w-32">
              <CustomSelect options={langOptions} value={language} onChange={setLanguage} />
            </div>
            <div className="hidden sm:flex px-2 md:px-3 py-1.5 bg-brandA/10 text-brandA rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest items-center gap-1.5">
              <FiZap className="animate-pulse" /> {toolBaseCosts.chat} kredit
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-6 px-1 md:px-2 pb-6 overscroll-contain">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-45 p-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4 shadow-xl text-brandA">
                <FiMessageSquare />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-1">Xush kelibsiz!</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Site, dars, test yoki boshqa savolingizni yozing</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={`${msg.role}-${index}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[92%] md:max-w-[85%] p-4 md:p-5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm break-words ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white rounded-br-none shadow-lg shadow-slate-900/10 ml-auto"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-none"
                }`}>
                  {(msg.imagePreview || msg.imageUrl) && (
                    <img
                      src={msg.imagePreview || msg.imageUrl}
                      alt={msg.imageName || "AI image"}
                      className="mb-3 max-h-72 w-full rounded-2xl object-contain bg-slate-950/5 dark:bg-white/5"
                    />
                  )}
                  {msg.role === "ai" ? <MarkdownRenderer text={msg.text} /> : <p className="whitespace-pre-line break-words">{msg.text}</p>}
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
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

        <form onSubmit={sendMessage} className="mt-3 shrink-0">
          {(selectedImage || imageMode) && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              {selectedImage && (
                <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <FiImage /> {selectedImage.name}
                  <button type="button" onClick={() => setSelectedImage(null)} className="text-rose-500"><FiX /></button>
                </span>
              )}
              {imageMode && (
                <span className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/10 px-3 py-2 text-indigo-500">
                  AI rasm rejimi
                  <button type="button" onClick={() => setImageMode(false)}><FiX /></button>
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-[2rem] border border-slate-100 bg-white p-2 shadow-2xl shadow-brandA/5 transition-all focus-within:ring-4 focus-within:ring-brandA/10 dark:border-slate-800 dark:bg-slate-900">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              title="Rasm yuklash"
            >
              <FiImage />
            </button>
            <button
              type="button"
              onClick={() => setImageMode((value) => !value)}
              className={`hidden sm:flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[9px] font-black uppercase tracking-widest transition ${imageMode ? "bg-indigo-600 text-white" : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"}`}
              title="AI rasm yaratish"
            >
              <FiZap /> AI rasm
            </button>
            <input
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm font-medium outline-none placeholder:opacity-40"
              placeholder={imageMode ? "Qanday rasm yaratilsin?" : "Savolingizni yozing..."}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
            />
            <span className="hidden md:inline-flex shrink-0 rounded-full bg-brandA/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-brandA">{activeCost} kredit</span>
            <button
              type="submit"
              disabled={(!input.trim() && !selectedImage) || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-20 dark:bg-brandA"
            >
              <FiSend className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
