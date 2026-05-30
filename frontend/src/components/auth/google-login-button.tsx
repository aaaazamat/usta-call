"use client";

import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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

export function GoogleLoginButton(props: Props) {
  if (!GOOGLE_CLIENT_ID) {
    return null; // Google sozlanmagan bo'lsa, tugma ko'rinmaydi
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleButtonInner {...props} />
    </GoogleOAuthProvider>
  );
}

function GoogleButtonInner({ redirectTo = "/", role, onNeedsPhone }: Props) {
  const router = useRouter();
  const t = useTranslations("auth.google");
  const tForm = useTranslations("auth.form");
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const redirectTarget = nextParam?.startsWith("/") ? nextParam : redirectTo;
  const setSession = useAuthStore((s) => s.setSession);

  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    flow: "implicit",
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      if (!accessToken) {
        toast.error(t("noData"));
        setLoading(false);
        return;
      }
      try {
        const result = await authApi.googleAccessLogin(accessToken, role);
        setSession(result.tokens, result.user);
        if (result.needs_phone) {
          toast.info(t("addPhone"));
          onNeedsPhone?.();
        } else {
          toast.success(
            result.is_new_user ? tForm("welcomeToast") : tForm("loggedIn"),
          );
          router.push(redirectTarget);
          router.refresh();
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toast.error(t("cancelled"));
      setLoading(false);
    },
    onNonOAuthError: () => {
      // Foydalanuvchi popup'ni yopdi yoki bekor qildi
      setLoading(false);
    },
  });

  return (
    <motion.button
      type="button"
      onClick={() => {
        setLoading(true);
        login();
      }}
      disabled={loading}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-white font-semibold text-gray-700 shadow-md transition-shadow hover:border-gray-300 hover:shadow-lg disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <GoogleIcon className="h-5 w-5" />
          <span>{t("continueWith")}</span>
        </>
      )}
    </motion.button>
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
