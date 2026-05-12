const DEFAULT_API_BASE_URL = "https://academiq-production-0920.up.railway.app";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");

export const apiUrl = (path = "") => {
  const normalizedPath = String(path || "");
  return `${API_BASE_URL}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
};

export const assetUrl = (path = "") => {
  const normalizedPath = String(path || "");
  if (!normalizedPath) return "";
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  return apiUrl(normalizedPath);
};
