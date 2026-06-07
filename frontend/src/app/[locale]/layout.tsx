import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import "../globals.css";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://usta-call.vercel.app"
).replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const title = `usta-call — ${t("heroTitle1")} ${t("heroTitleAccent")} ${t("heroTitle2")}`.trim();
  const description = t("heroSubtitle");

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s · usta-call" },
    description,
    applicationName: "usta-call",
    keywords: [
      "usta", "usta topish", "usta call", "santexnik", "elektrik", "quruvchi",
      "bo'yoqchi", "klimatchi", "avto usta", "tikuvchi", "uy ta'miri",
      "Toshkent usta", "O'zbekiston usta", "master", "remont", " remont ustasi",
    ],
    alternates: {
      canonical: `/${locale}`,
      languages: { uz: "/uz", ru: "/ru", kk: "/kk" },
    },
    openGraph: {
      type: "website",
      siteName: "usta-call",
      url: `${SITE_URL}/${locale}`,
      title,
      description,
      locale,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Statik render uchun joriy locale'ni server'ga eslatamiz
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <NextIntlClientProvider>
          <Providers>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
