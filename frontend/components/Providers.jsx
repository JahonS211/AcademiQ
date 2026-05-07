"use client";

import { Toaster } from "react-hot-toast";
import { I18nProvider } from "../lib/i18n";

export default function Providers({ children }) {
  return (
    <I18nProvider>
      {children}
      <Toaster position="top-right" />
    </I18nProvider>
  );
}
