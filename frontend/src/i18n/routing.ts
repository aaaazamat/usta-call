import { defineRouting } from "next-intl/routing";

// Qo'llab-quvvatlanadigan tillar — backend `settings.LANGUAGES` bilan mos.
export const routing = defineRouting({
  locales: ["uz", "kk", "ru"],
  defaultLocale: "uz",
  // /uz, /kk, /ru — har doim prefix ko'rsatiladi (toza URL emas)
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
