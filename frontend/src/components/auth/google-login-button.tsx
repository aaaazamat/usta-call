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
      <div className="w-full flex justify-center [&>div]:!w-full">
        <GoogleLogin
          size="large"
          width="100%"
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
    </GoogleOAuthProvider>
  );
}
