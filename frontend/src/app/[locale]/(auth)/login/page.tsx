import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { OtpAuthForm } from "@/components/auth/otp-auth-form";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return { title: t("metaTitle") };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-64" />}>
        <OtpAuthForm mode="login" />
      </Suspense>
      <div className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          {t("signUp")}
        </Link>
      </div>
    </div>
  );
}
