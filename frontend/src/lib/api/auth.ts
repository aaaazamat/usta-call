import { api } from "@/lib/api/client";
import type {
  GoogleLoginResponse,
  OtpRequestPayload,
  OtpRequestResponse,
  OtpVerifyPayload,
  OtpVerifyResponse,
  Role,
  TelegramLinkPollResponse,
  TelegramLinkStartResponse,
  User,
} from "@/lib/api/types";

export interface UpdateMePayload {
  full_name?: string;
  avatar?: File | null;
}

function buildMeFormData(payload: UpdateMePayload): FormData | Record<string, unknown> {
  if (payload.avatar instanceof File) {
    const fd = new FormData();
    if (payload.full_name !== undefined) fd.append("full_name", payload.full_name);
    fd.append("avatar", payload.avatar);
    return fd;
  }
  const body: Record<string, unknown> = {};
  if (payload.full_name !== undefined) body.full_name = payload.full_name;
  if (payload.avatar === null) body.avatar = null;
  return body;
}

export const authApi = {
  requestOtp: (payload: OtpRequestPayload) =>
    api.post<OtpRequestResponse>("/auth/otp/request/", payload).then((r) => r.data),

  verifyOtp: (payload: OtpVerifyPayload) =>
    api.post<OtpVerifyResponse>("/auth/otp/verify/", payload).then((r) => r.data),

  me: () => api.get<User>("/auth/me/").then((r) => r.data),

  updateMe: (payload: UpdateMePayload) => {
    const data = buildMeFormData(payload);
    const isMultipart = data instanceof FormData;
    return api
      .patch<User>("/auth/me/", data, {
        headers: isMultipart ? { "Content-Type": "multipart/form-data" } : undefined,
      })
      .then((r) => r.data);
  },

  switchRole: (role: Exclude<Role, "admin">) =>
    api.post<User>("/auth/me/role/", { role }).then((r) => r.data),

  // Google'dan keyin telefon qo'shish
  addPhone: (phone: string) =>
    api.post<User>("/auth/me/phone/", { phone }).then((r) => r.data),

  // Telegram bot ulanish flow
  telegramLinkStart: () =>
    api
      .post<TelegramLinkStartResponse>("/auth/telegram/link/start/")
      .then((r) => r.data),

  telegramLinkPoll: (token: string) =>
    api
      .post<TelegramLinkPollResponse>("/auth/telegram/link/poll/", { token })
      .then((r) => r.data),

  // Google OAuth ID token bilan kirish (rasmiy GoogleLogin komponenti)
  googleLogin: (idToken: string, role?: Exclude<Role, "admin">) =>
    api
      .post<GoogleLoginResponse>("/auth/google/", {
        id_token: idToken,
        ...(role ? { role } : {}),
      })
      .then((r) => r.data),

  // Google OAuth access token bilan kirish (custom tugma, useGoogleLogin)
  googleAccessLogin: (accessToken: string, role?: Exclude<Role, "admin">) =>
    api
      .post<GoogleLoginResponse>("/auth/google/", {
        access_token: accessToken,
        ...(role ? { role } : {}),
      })
      .then((r) => r.data),
};
