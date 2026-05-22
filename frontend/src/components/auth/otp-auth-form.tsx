"use client";

import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
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
          mode === "register" ? "Xush kelibsiz!" : "Tizimga kirdingiz",
        );
        router.push(redirectTarget);
        router.refresh();
        return;
      }
      // Telegram bot bilan ulanmagan — foydalanuvchini Telegram tugmasiga yo'naltirish
      if (data.needs_telegram_link) {
        setTelegramHint(data.telegram_bot_username ?? "");
        toast.info("Avval Telegram bilan ulaning");
        return;
      }
      setStep("code");
      setResendIn(RESEND_SECONDS);
      toast.success("Kod telefoningizga yuborildi");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const verifyMutation = useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: ({ user, tokens }) => {
      setSession(tokens, user);
      toast.success(mode === "register" ? "Xush kelibsiz!" : "Tizimga kirdingiz");
      router.push(redirectTarget);
      router.refresh();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUzPhone(phone)) {
      toast.error("Telefon raqamini to'liq kiriting");
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
            Raqamni o&apos;zgartirish
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
            <h2 className="text-2xl font-bold">Tasdiqlash kodi</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{phone}</span>
              <br />
              raqamiga 6 xonali kod yubordik
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
              Tekshirilmoqda...
            </motion.div>
          )}

          <div className="text-center text-sm">
            {resendIn > 0 ? (
              <span className="text-muted-foreground">
                Qayta yuborish{" "}
                <span className="font-semibold text-foreground">{resendIn}</span>{" "}
                soniyadan keyin
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
                Kodni qayta yuborish
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
              {mode === "register" ? "Ro'yxatdan o'tish" : "Xush kelibsiz!"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "register"
                ? "Quyidagi usullardan birini tanlang"
                : "Quyidagi usullardan birini tanlang"}
            </p>
          </div>

          {/* Tezkor kirish: Telegram va Google */}
          <div className="space-y-3">
            <TelegramLoginButton redirectTo={redirectTarget} />
            <GoogleLoginButton
              redirectTo={redirectTarget}
              onNeedsPhone={() => setPhoneDialogOpen(true)}
            />
          </div>

          {telegramHint !== null && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <p className="font-medium mb-0.5">Avval Telegram'ga ulanish kerak</p>
              <p className="text-amber-800 text-xs">
                Yuqoridagi <span className="font-semibold">&quot;Telegram bilan davom etish&quot;</span> tugmasini bosing.
                {telegramHint && (
                  <>
                    {" "}Yoki to&apos;g&apos;ridan-to&apos;g&apos;ri{" "}
                    <a
                      href={`https://t.me/${telegramHint.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold"
                    >
                      @{telegramHint.replace(/^@/, "")}
                    </a>{" "}
                    ga o&apos;ting.
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
                yoki telefon orqali
              </span>
            </div>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            {showRoleSelect && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <Label>Men kim?</Label>
              <div className="grid grid-cols-2 gap-3">
                <RoleOption
                  active={role === "client"}
                  onClick={() => setRole("client")}
                  title="Mijoz"
                  text="Xizmat qidiraman"
                  icon={<UserIcon className="h-5 w-5" />}
                />
                <RoleOption
                  active={role === "master"}
                  onClick={() => setRole("master")}
                  title="Usta"
                  text="Xizmat ko'rsataman"
                  icon={<Wrench className="h-5 w-5" />}
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon raqami</Label>
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
              SMS orqali tasdiqlash kodi yuboriladi
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
                  Yuborilmoqda...
                </>
              ) : mode === "register" ? (
                "Ro'yxatdan o'tish"
              ) : (
                "Davom etish"
              )}
            </span>
          </Button>

            <div className="text-center text-xs text-muted-foreground">
              Davom etish orqali siz{" "}
              <a href="#" className="text-foreground underline underline-offset-2">
                foydalanish shartlari
              </a>{" "}
              bilan rozisiz
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
