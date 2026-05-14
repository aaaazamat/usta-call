import { AxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback = "Xatolik yuz berdi"): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data) {
      if (typeof data.detail === "string") return data.detail;
      const firstFieldError = Object.values(data).find((v) => Array.isArray(v) && v.length);
      if (Array.isArray(firstFieldError) && typeof firstFieldError[0] === "string") {
        return firstFieldError[0];
      }
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
