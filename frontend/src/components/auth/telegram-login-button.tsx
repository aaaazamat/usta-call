"use client";

import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useAuthStore } from "@/lib/auth/store";

const POLL_INTERVAL_MS = 2000; // 2 sekundda bir tekshirish
const POLL_TIMEOUT_MS = 5 * 60_000; // 5 daqiqa

interface Props {
  redirectTo?: string;
}

/** Telegram bilan kirish tugmasi.
 *
 * Bosilganda backend'dan deep link oladi va botni yangi tab'da ochadi.
 * Keyin polling bilan tasdiqlanishini kutadi.
 */
export function TelegramLoginButton({ redirectTo = "/" }: Props) {
  const router = useRouter();
  const t = useTranslations("auth.telegram");
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const redirectTarget = nextParam?.startsWith("/") ? nextParam : redirectTo;
  const setSession = useAuthStore((s) => s.setSession);

  const [waiting, setWaiting] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);

  // Polling tozalanishi
  useEffect(() => {
    return () => {
      pollAbortRef.current?.abort();
    };
  }, []);

  const startLink = async () => {
    setWaiting(true);
    try {
      const { token, deep_link } = await authApi.telegramLinkStart();
      setDeepLink(deep_link);
      // Yangi tab'da botni ochish
      window.open(deep_link, "_blank", "noopener,noreferrer");
      // Polling
      pollAbortRef.current?.abort();
      const ctrl = new AbortController();
      pollAbortRef.current = ctrl;
      pollUntilLinked(token, ctrl.signal)
        .then((result) => {
          if (result.status === "linked" && result.user && result.tokens) {
            setSession(result.tokens, result.user);
            toast.success(t("welcomeUser", { name: result.user.full_name || t("friend") }));
            router.push(redirectTarget);
            router.refresh();
          } else {
            toast.error(t("timeout"));
            setWaiting(false);
            setDeepLink(null);
          }
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            toast.error(getApiErrorMessage(err));
          }
          setWaiting(false);
          setDeepLink(null);
        });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setWaiting(false);
    }
  };

  const cancel = () => {
    pollAbortRef.current?.abort();
    setWaiting(false);
    setDeepLink(null);
  };

  if (waiting && deepLink) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white inline-flex items-center justify-center">
            <Send className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{t("waitingTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("waitingText")}
            </p>
          </div>
          <button
            type="button"
            onClick={cancel}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={t("cancel")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("reopenBot")}
        </a>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("waiting")}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={startLink}
      disabled={waiting}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="w-full h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow disabled:opacity-60"
    >
      {waiting ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <Send className="h-5 w-5" />
          {t("continueWith")}
        </>
      )}
    </motion.button>
  );
}

async function pollUntilLinked(
  token: string,
  signal: AbortSignal,
): Promise<{ status: "linked" | "timeout"; user?: import("@/lib/api/types").User; tokens?: import("@/lib/api/types").AuthTokens }> {
  const start = Date.now();
  while (!signal.aborted && Date.now() - start < POLL_TIMEOUT_MS) {
    try {
      const result = await authApi.telegramLinkPoll(token);
      if (result.status === "linked") {
        return { status: "linked", user: result.user, tokens: result.tokens };
      }
    } catch {
      // Network xato bo'lsa polling davom etadi
    }
    await sleep(POLL_INTERVAL_MS, signal);
  }
  return { status: "timeout" };
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}
