"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useI18n } from "./i18n";

export default function useRequireAuth() {
  const router = useRouter();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error(t("authRequired"));
      router.push("/login");
      return;
    }
    setReady(true);
  }, [router, t]);

  return ready;
}
