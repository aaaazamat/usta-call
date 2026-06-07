import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://usta-call.vercel.app"
).replace(/\/$/, "");

// Google'ga ko'rsatiladigan asosiy sahifalar (har tilda hreflang bilan)
const PATHS: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "", priority: 1.0, freq: "daily" },
  { path: "/masters", priority: 0.9, freq: "daily" },
  { path: "/how-it-works", priority: 0.6, freq: "monthly" },
  { path: "/orders/new", priority: 0.7, freq: "weekly" },
  { path: "/privacy", priority: 0.3, freq: "yearly" },
  { path: "/terms", priority: 0.3, freq: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map(({ path, priority, freq }) => ({
    url: `${BASE}/${routing.defaultLocale}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${BASE}/${l}${path}`]),
      ),
    },
  }));
}
