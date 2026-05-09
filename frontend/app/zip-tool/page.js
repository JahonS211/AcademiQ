"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { syncUserCredits } from "../../lib/syncUtils";
import { FiFolder, FiFile, FiX, FiZap, FiDownload, FiArchive, FiTrash2 } from "react-icons/fi";

export default function ZipToolPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: true
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setFiles([]);
    setResultUrl("");
  };

  const handleZip = async () => {
    if (files.length === 0) return toast.error("Iltimos, fayllarni tanlang");
    setLoading(true);
    setResultUrl("");
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));

      const { data } = await axios.post("https://academiq-production-0920.up.railway.app/api/compress", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (data.success && data.resultUrl) {
        setResultUrl(data.resultUrl);
        toast.success("Fayllar muvaffaqiyatli arxivlandi!");
        syncUserCredits(data.remainingCredits);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 mb-2">
          <FiArchive className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fast Archiver</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">ZIP Tool</h1>
        <p className="text-slate-500 font-medium text-sm max-w-lg mx-auto">
          Ko'plab fayllarni bitta ZIP arxiviga to'plang va yuklab oling.
        </p>
      </div>

      <div className="card p-10 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[3rem]">
        <div
          {...getRootProps()}
          className={`relative overflow-hidden cursor-pointer rounded-[2rem] p-12 transition-all border-4 border-dashed ${
            isDragActive 
              ? "bg-emerald-500/5 border-emerald-500" 
              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
          }`}
        >
          <input {...getInputProps()} />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl shadow-xl flex items-center justify-center text-4xl text-emerald-500">
               <FiFolder />
            </div>
            <div className="text-center">
               <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Fayllarni shu yerga tashlang</p>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">yoki kompyuterdan tanlash uchun bosing</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 space-y-3"
            >
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tanlangan fayllar ({files.length})</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <FiFile className="shrink-0 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{f.name}</span>
                    </div>
                    <button 
                      onClick={() => removeFile(i)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="pt-6 flex flex-col items-center gap-4">
                <button
                  onClick={handleZip}
                  disabled={loading}
                  className="w-full py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? "Arxivlanmoqda..." : (
                    <>
                      ZIP Arxiv Yaratish <FiZap className="text-amber-400" />
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="w-full py-4 rounded-3xl bg-rose-500/10 text-rose-500 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center gap-3"
                >
                  <FiTrash2 />
                  Tozalash
                </button>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <FiZap /> 1 Credit required
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {resultUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-8 bg-emerald-500 text-white rounded-[2rem] shadow-xl shadow-emerald-500/20 flex flex-col items-center text-center gap-4"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
               <FiDownload />
            </div>
            <div>
               <h4 className="text-xl font-black uppercase tracking-tight leading-none mb-1">Tayyor!</h4>
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">ZIP arxiv muvaffaqiyatli yaratildi</p>
            </div>
            <div className="mt-2 flex flex-col sm:flex-row gap-3">
              <a 
                href={`https://academiq-production-0920.up.railway.app/${resultUrl}`}
                download
                className="px-10 py-4 bg-white text-emerald-600 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
              >
                Yuklab Olish
              </a>
              <button
                onClick={handleClear}
                className="px-10 py-4 bg-white/15 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white/25 transition-all flex items-center justify-center gap-2"
              >
                <FiTrash2 />
                Tozalash
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
