"use client";

import { Toaster } from "react-hot-toast";
import { I18nProvider } from "../lib/i18n";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLoader from "./AppLoader";

export default function Providers({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate hydration and initial data check
    const timer = setTimeout(() => setLoading(false), 1500);

    // Check server connection
    fetch("https://academiq-production-0920.up.railway.app/health").catch(() => {
      console.warn("Backend server is offline. Please start it with 'npm run dev' in the root directory.");
    });

    return () => clearTimeout(timer);
  }, []);

  return (
    <I18nProvider>
      <AppLoader loading={loading} />
      <AnimatePresence>
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="top-right" />
    </I18nProvider>
  );
}
