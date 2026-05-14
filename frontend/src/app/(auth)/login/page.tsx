import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";

import { OtpAuthForm } from "@/components/auth/otp-auth-form";

export const metadata: Metadata = {
  title: "Kirish · usta-call",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-64" />}>
        <OtpAuthForm mode="login" />
      </Suspense>
      <div className="text-center text-sm text-muted-foreground">
        Hisobingiz yo&apos;qmi?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Ro&apos;yxatdan o&apos;ting
        </Link>
      </div>
    </div>
  );
}
