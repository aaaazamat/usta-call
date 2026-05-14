"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
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

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const requestMutation = useMutation({
    mutationFn: authApi.requestOtp,
    onSuccess: (data) => {
      // Beta rejim — server darhol tokenlar bilan javob bersa, OTP qadamisiz kirib boramiz
      if (data.auto_login && data.tokens && data.user) {
        setSession(data.tokens, data.user);
        toast.success(
          mode === "register" ? "Xush kelibsiz!" : "Tizimga kirdingiz",
        );
        router.push(redirectTarget);
        router.refresh();
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

  if (step === "code") {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
          }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Raqamni o&apos;zgartirish
        </button>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Tasdiqlash kodi</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{phone}</span> raqamiga 6 xonali kod
            yubordik
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
            <InputOTPGroup className="[&>div]:size-12 [&>div]:text-lg">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup className="[&>div]:size-12 [&>div]:text-lg">
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {verifyMutation.isPending && (
          <div className="flex justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Tekshirilmoqda...
          </div>
        )}

        <div className="text-center text-sm">
          {resendIn > 0 ? (
            <span className="text-muted-foreground">
              Qayta yuborish {resendIn} soniyadan keyin
            </span>
          ) : (
            <button
              type="button"
              onClick={() =>
                requestMutation.mutate({ phone: toE164(phone), role })
              }
              disabled={requestMutation.isPending}
              className="text-primary hover:underline disabled:opacity-50"
            >
              Kodni qayta yuborish
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePhoneSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">
          {mode === "register" ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Telefon raqamingizni kiriting — sizga SMS orqali kod yuboramiz
        </p>
      </div>

      {showRoleSelect && (
        <div className="space-y-2">
          <Label>Men kim?</Label>
          <div className="grid grid-cols-2 gap-2">
            <RoleOption
              active={role === "client"}
              onClick={() => setRole("client")}
              title="Mijoz"
              text="Xizmat qidiraman"
            />
            <RoleOption
              active={role === "master"}
              onClick={() => setRole("master")}
              title="Usta"
              text="Xizmat ko'rsataman"
            />
          </div>
        </div>
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
          className="text-base"
          autoFocus
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={requestMutation.isPending || !isValidUzPhone(phone)}
      >
        {requestMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Yuborilmoqda...
          </>
        ) : (
          "Kod olish"
        )}
      </Button>
    </form>
  );
}

function RoleOption({
  active,
  onClick,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-lg border p-3 text-left transition " +
        (active
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "hover:border-foreground/30")
      }
    >
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{text}</div>
    </button>
  );
}
