import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import { tokenStorage } from "@/lib/auth/tokens";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = tokenStorage.getAccess();
  if (access) {
    config.headers.set("Authorization", `Bearer ${access}`);
  }
  // Joriy til (next-intl cookie) ni backend'ga yetkazamiz —
  // Django `LocaleMiddleware` shu header asosida `request.LANGUAGE_CODE` ni o'rnatadi
  // va parler `safe_translation_getter` shu tilda javob qaytaradi.
  if (typeof document !== "undefined") {
    const locale = readLocaleCookie();
    if (locale) config.headers.set("Accept-Language", locale);
  }
  return config;
});

function readLocaleCookie(): string | null {
  // next-intl middleware sukut bo'yicha "NEXT_LOCALE" cookie'ga yozadi
  const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error("No refresh token");

  const response = await axios.post<{ access: string }>(
    `${API_URL}/auth/token/refresh/`,
    { refresh },
  );
  tokenStorage.setAccess(response.data.access);
  return response.data.access;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newAccess = await refreshPromise;
        original.headers.set("Authorization", `Bearer ${newAccess}`);
        return api(original);
      } catch (refreshError) {
        tokenStorage.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
