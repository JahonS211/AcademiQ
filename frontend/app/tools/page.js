"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { useI18n } from "../../lib/i18n";
import useRequireAuth from "../../lib/useRequireAuth";
import { FiFolder, FiFileText, FiSearch, FiMinimize2, FiCopy } from "react-icons/fi";

export default function ToolsPage() {
  const { t } = useI18n();
  const ready = useRequireAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState("");
  const [ocrResult, setOcrResult] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: false
  });

  const runTool = async (type) => {
    if (!file) return toast.error(t("dropzone"));
    setLoading(type);
    setOcrResult("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      let endpoint = "";
      if (type === "pdf") endpoint = "image-to-pdf";
      if (type === "ocr") endpoint = "image-to-text";
      if (type === "compress") endpoint = "compress";

      const { data } = await axios.post(`https://academiq-api-hsvi.onrender.com/api/${endpoint}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (data.resultUrl) {
        window.open(`https://academiq-api-hsvi.onrender.com${data.resultUrl}`, "_blank");
        toast.success(t("processSuccess"));
      } else if (data.extractedText) {
        setOcrResult(data.extractedText);
        toast.success(t("processSuccess"));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t("processFailed"));
    } finally {
      setLoading("");
    }
  };

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <div className="card p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
        <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter">{t("fileTools")}</h1>
        
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-[2rem] p-8 transition-all border-2 ${
            isDragActive ? "bg-brandA/5 border-brandA border-solid" : "bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex justify-center text-4xl mb-4 text-slate-400 dark:text-slate-500">
            <FiFolder />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {file ? `${t("selected")}: ${file.name}` : t("dropzone")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button 
          className="card p-5 text-center hover:scale-[1.02] transition-all group border-none shadow-lg" 
          onClick={() => runTool("pdf")}
          disabled={loading === "pdf"}
        >
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:rotate-12 transition-all">
            <FiFileText />
          </div>
          <h3 className="font-black text-xs uppercase tracking-widest">Rasm → PDF</h3>
          <p className="text-[10px] text-slate-500 mt-2 font-bold">
            {loading === "pdf" ? t("loading") : t("processSuccess")}
          </p>
        </button>

        <button 
          className="card p-5 text-center hover:scale-[1.02] transition-all group border-none shadow-lg" 
          onClick={() => runTool("ocr")}
          disabled={loading === "ocr"}
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-all">
            <FiSearch />
          </div>
          <h3 className="font-black text-xs uppercase tracking-widest">Rasm → Matn</h3>
          <p className="text-[10px] text-slate-500 mt-2 font-bold">
            {loading === "ocr" ? t("loading") : t("processSuccess")}
          </p>
        </button>

        <button 
          className="card p-5 text-center hover:scale-[1.02] transition-all group border-none shadow-lg" 
          onClick={() => runTool("compress")}
          disabled={loading === "compress"}
        >
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:-translate-y-1 transition-all">
            <FiMinimize2 />
          </div>
          <h3 className="font-black text-xs uppercase tracking-widest">Siqish (ZIP)</h3>
          <p className="text-[10px] text-slate-500 mt-2 font-bold">
            {loading === "compress" ? t("loading") : t("processSuccess")}
          </p>
        </button>
      </div>

      {ocrResult && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl"
        >
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brandA animate-ping" />
            {t("result")}
          </h3>
          <pre className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-medium text-sm whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-800">
            {ocrResult}
          </pre>
          <button 
            className="mt-6 px-6 py-2 bg-brandA/10 text-brandA rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brandA hover:text-white transition-all"
            onClick={() => {
              navigator.clipboard.writeText(ocrResult);
              toast.success(t("copied"));
            }}
          >
            {t("copy")}
          </button>
        </motion.div>
      )}
    </div>
  );
}
