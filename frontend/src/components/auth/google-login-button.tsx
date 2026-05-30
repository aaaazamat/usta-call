"use client";

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Role } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

interface Props {
  redirectTo?: string;
  /** Birinchi marta ro'yxatdan o'tganda tanlangan rol (mijoz/usta) */
  role?: Exclude<Role, "admin">;
  /** Foydalanuvchi Google bilan kirgach, agar telefoni yo'q bo'lsa chaqiriladi */
  onNeedsPhone?: () => void;
}

export function GoogleLoginButton({
  redirectTo = "/",
  role,
  onNeedsPhone,
}: Props) {
  const router = useRouter();
  const t = useTranslations("auth.google");
  const tForm = useTranslations("auth.form");
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const redirectTarget = nextParam?.startsWith("/") ? nextParam : redirectTo;
  const setSession = useAuthStore((s) => s.setSession);

  if (!GOOGLE_CLIENT_ID) {
    return null; // Google sozlanmagan bo'lsa, tugma ko'rinmaydi
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/*
        Google'ning rasmiy tugmasi iframe ichida render bo'ladi va uni
        to'g'ridan-to'g'ri stillab bo'lmaydi (cross-origin). Shuning uchun
        ostiga chiroyli "custom" tugma chizamiz, ustiga esa rasmiy Google
        tugmasini shaffof (opacity-0) qilib, butun maydonni qoplaydigan
        darajada kattalashtirib qo'yamiz. Bosish aynan shu ko'rinmas
        tugmaga tushadi va ID token oqimi o'zgarishsiz ishlayveradi.
      */}
      <div className="group relative h-12 w-full select-none">
        {/* Ko'rinadigan chiroyli qatlam (bosilmaydi) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 rounded-xl border border-border bg-white font-semibold text-gray-700 shadow-md transition-all duration-200 group-hover:scale-[1.01] group-hover:border-gray-300 group-hover:shadow-lg group-active:scale-[0.98] dark:bg-zinc-900 dark:text-zinc-100 dark:group-hover:border-zinc-700">
          <GoogleIcon className="h-5 w-5" />
          <span>{t("continueWith")}</span>
        </div>

        {/* Haqiqiy Google tugmasi — ko'rinmas, maydonni to'liq qoplaydi */}
        <div className="absolute inset-0 z-10 overflow-hidden rounded-xl opacity-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.7]">
            <GoogleLogin
              size="large"
              width="360"
              shape="rectangular"
              theme="outline"
              text="continue_with"
              onSuccess={async (credential) => {
                if (!credential.credential) {
                  toast.error(t("noData"));
                  return;
                }
                try {
                  const result = await authApi.googleLogin(
                    credential.credential,
                    role,
                  );
                  setSession(result.tokens, result.user);
                  if (result.needs_phone) {
                    toast.info(t("addPhone"));
                    onNeedsPhone?.();
                  } else {
                    toast.success(
                      result.is_new_user
                        ? tForm("welcomeToast")
                        : tForm("loggedIn"),
                    );
                    router.push(redirectTarget);
                    router.refresh();
                  }
                } catch (err) {
                  toast.error(getApiErrorMessage(err));
                }
              }}
              onError={() => {
                toast.error(t("cancelled"));
              }}
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

/** Rasmiy Google brendingi (4 rangli) */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
