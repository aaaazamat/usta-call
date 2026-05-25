import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";

import { OtpAuthForm } from "@/components/auth/otp-auth-form";
import type { Role } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish · usta-call",
};

interface PageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const { role } = await searchParams;
  const initialRole: Role = role === "master" ? "master" : "client";

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-64" />}>
        <OtpAuthForm mode="register" initialRole={initialRole} showRoleSelect />
      </Suspense>
      <div className="text-center text-sm text-muted-foreground">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Kirish
        </Link>
      </div>
    </div>
  );
}
