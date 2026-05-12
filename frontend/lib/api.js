import { API_BASE_URL } from "./config";
import axios from "axios";

const api = axios.create({
  baseURL: `${API_BASE_URL}`,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authApi = {
  register: (payload) => api.post("/api/auth/register", payload),
  login: (payload) => api.post("/api/auth/login", payload),
  adminLogin: (payload) => api.post("/api/auth/admin/login", payload),
  googleLogin: (payload) => api.post("/api/auth/google", payload),
};

export const essayApi = {
  generate: (payload) => api.post("/api/generate-essay", payload),
  history: () => api.get("/api/essays"),
};

export const presentationApi = {
  list: () => api.get("/api/presentations"),
  adminUpload: (payload, adminToken) =>
    api.post("/api/admin/upload", payload, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }),
};

export const testsApi = {
  list: () => api.get("/api/tests"),
  submit: (payload) => api.post("/api/submit-test", payload),
};

export const toolsApi = {
  pdfToWord: () => api.post("/api/pdf-to-word"),
  imageToText: () => api.post("/api/image-to-text"),
  compress: () => api.post("/api/compress"),
};

export const referralApi = {
  me: () => api.get("/api/referrals/me"),
};

export const promoApi = {
  validate: (payload) => api.post("/api/promo/validate", payload),
};

export const rewardsApi = {
  me: () => api.get("/api/rewards/me"),
  apply: (payload) => api.post("/api/rewards/apply", payload),
};

export const presenceApi = {
  ping: () => api.post("/api/presence/ping"),
};

export default api;
