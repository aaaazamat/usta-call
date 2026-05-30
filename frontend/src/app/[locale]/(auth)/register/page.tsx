import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { OtpAuthForm } from "@/components/auth/otp-auth-form";
import { Link } from "@/i18n/navigation";
import type { Role } from "@/lib/api/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.register" });
  return { title: t("metaTitle") };
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
}

export default async function RegisterPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { role } = await searchParams;
  const initialRole: Role = role === "master" ? "master" : "client";
  const t = await getTranslations({ locale, namespace: "auth.register" });

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-64" />}>
        <OtpAuthForm mode="register" initialRole={initialRole} showRoleSelect />
      </Suspense>
      <div className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          {t("signIn")}
        </Link>
      </div>
    </div>
  );
}
