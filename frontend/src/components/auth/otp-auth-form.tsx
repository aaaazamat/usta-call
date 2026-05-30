"use client";

import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  User as UserIcon,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { AddPhoneDialog } from "@/components/auth/add-phone-dialog";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Role } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { formatUzPhoneInput, isValidUzPhone, toE164 } from "@/lib/phone";

const RESEND_SECONDS = 60;

interface Props {
  mode: "login" | "register";
  initialRole?: Role;
  showRoleSelect?: boolean;
  redirectTo?: string;
}

export function OtpAuthForm({
  mode,
  initialRole = "client",
  showRoleSelect = false,
  redirectTo = "/",
}: Props) {
  const router = useRouter();
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const redirectTarget = nextParam && nextParam.startsWith("/") ? nextParam : redirectTo;
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+998 ");
  const [role, setRole] = useState<Role>(initialRole);
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [telegramHint, setTelegramHint] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const requestMutation = useMutation({
    mutationFn: authApi.requestOtp,
    onSuccess: (data) => {
      if (data.auto_login && data.tokens && data.user) {
        setSession(data.tokens, data.user);
        toast.success(
          mode === "register" ? t("form.welcomeToast") : t("form.loggedIn"),
        );
        router.push(redirectTarget);
        router.refresh();
        return;
      }
      // Telegram bot bilan ulanmagan — foydalanuvchini Telegram tugmasiga yo'naltirish
      if (data.needs_telegram_link) {
        setTelegramHint(data.telegram_bot_username ?? "");
        toast.info(t("telegram.connectFirst"));
        return;
      }
      setStep("code");
      setResendIn(RESEND_SECONDS);
      toast.success(t("form.codeSent"));
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const verifyMutation = useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: ({ user, tokens }) => {
      setSession(tokens, user);
      toast.success(mode === "register" ? t("form.welcomeToast") : t("form.loggedIn"));
      router.push(redirectTarget);
      router.refresh();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUzPhone(phone)) {
      toast.error(t("form.enterFullPhone"));
      return;
    }
    requestMutation.mutate({ phone: toE164(phone), role });
  };

  const handleCodeSubmit = (value: string) => {
    if (value.length !== 6) return;
    verifyMutation.mutate({ phone: toE164(phone), code: value });
  };

  return (
    <AnimatePresence mode="wait">
      {step === "code" ? (
        <motion.div
          key="code"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
            }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            {t("otp.changeNumber")}
          </button>

          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 mb-2"
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold">{t("otp.title")}</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{phone}</span>
              <br />
              {t("otp.sentSuffix")}
            </p>
          </div>

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(v) => {
                setCode(v);
                if (v.length === 6) handleCodeSubmit(v);
              }}
              autoFocus
              disabled={verifyMutation.isPending}
            >
              <InputOTPGroup className="[&>div]:size-12 [&>div]:text-lg [&>div]:font-semibold">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="[&>div]:size-12 [&>div]:text-lg [&>div]:font-semibold">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {verifyMutation.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center text-sm text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t("otp.checking")}
            </motion.div>
          )}

          <div className="text-center text-sm">
            {resendIn > 0 ? (
              <span className="text-muted-foreground">
                {t("otp.resendPrefix")}{" "}
                <span className="font-semibold text-foreground">{resendIn}</span>{" "}
                {t("otp.resendSuffix")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  requestMutation.mutate({ phone: toE164(phone), role })
                }
                disabled={requestMutation.isPending}
                className="text-primary hover:underline font-medium disabled:opacity-50"
              >
                {t("otp.resend")}
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="phone"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === "register" ? t("form.registerTitle") : t("form.welcome")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("form.chooseMethod")}
            </p>
          </div>

          {showRoleSelect && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <Label>{t("form.whoami")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <RoleOption
                  active={role === "client"}
                  onClick={() => setRole("client")}
                  title={t("form.clientTitle")}
                  text={t("form.clientText")}
                  icon={<UserIcon className="h-5 w-5" />}
                />
                <RoleOption
                  active={role === "master"}
                  onClick={() => setRole("master")}
                  title={t("form.masterTitle")}
                  text={t("form.masterText")}
                  icon={<Wrench className="h-5 w-5" />}
                />
              </div>
            </motion.div>
          )}

          {/* Tezkor kirish: Telegram va Google */}
          <div className="space-y-3">
            <TelegramLoginButton redirectTo={redirectTarget} />
            <GoogleLoginButton
              redirectTo={redirectTarget}
              role={role === "admin" ? "client" : role}
              onNeedsPhone={() => setPhoneDialogOpen(true)}
            />
          </div>

          {telegramHint !== null && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <p className="font-medium mb-0.5">{t("telegram.linkFirstTitle")}</p>
              <p className="text-amber-800 text-xs">
                {t("telegram.linkFirstText")}
                {telegramHint && (
                  <>
                    {" "}{t("telegram.linkFirstOr")}{" "}
                    <a
                      href={`https://t.me/${telegramHint.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold"
                    >
                      @{telegramHint.replace(/^@/, "")}
                    </a>{" "}
                    {t("telegram.linkFirstGoto")}
                  </>
                )}
              </p>
            </motion.div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground uppercase tracking-wider">
                {t("form.orPhone")}
              </span>
            </div>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("form.phoneLabel")}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatUzPhoneInput(e.target.value))}
              placeholder="+998 90 123 45 67"
              className="h-12 text-base"
              autoFocus
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              {t("form.smsHint")}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold relative overflow-hidden group"
            size="lg"
            disabled={requestMutation.isPending || !isValidUzPhone(phone)}
          >
            <span className="relative z-10 inline-flex items-center">
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("form.sending")}
                </>
              ) : mode === "register" ? (
                t("form.registerTitle")
              ) : (
                t("form.continue")
              )}
            </span>
          </Button>

            <div className="text-center text-xs text-muted-foreground">
              {t("form.termsPrefix")}{" "}
              <a href="#" className="text-foreground underline underline-offset-2">
                {t("form.termsLink")}
              </a>{" "}
              {t("form.termsSuffix")}
            </div>
          </form>

          <AddPhoneDialog
            open={phoneDialogOpen}
            onOpenChange={setPhoneDialogOpen}
            redirectTo={redirectTarget}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RoleOption({
  active,
  onClick,
  title,
  text,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={
        "relative rounded-xl border-2 p-4 text-left transition-all " +
        (active
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-foreground/30 hover:bg-muted/40")
      }
    >
      <div
        className={
          "inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2 transition-colors " +
          (active
            ? "bg-gradient-to-br from-primary to-purple-500 text-white"
            : "bg-muted text-muted-foreground")
        }
      >
        {icon}
      </div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{text}</div>
      {active && (
        <motion.div
          layoutId="role-check"
          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center"
        >
          <CheckCircle2 className="h-4 w-4" />
        </motion.div>
      )}
    </motion.button>
  );
}
