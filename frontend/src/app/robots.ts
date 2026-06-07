import type { MetadataRoute } from "next";

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://usta-call.vercel.app"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Shaxsiy/ichki sahifalar indekslanmasin
        disallow: [
          "/api/",
          "/*/dashboard",
          "/*/profile",
          "/*/chat",
          "/*/orders/",
          "/*/bookings",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
