"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Globe, Check } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LABELS: Record<Locale, { native: string; flag: string }> = {
  uz: { native: "Oʻzbekcha", flag: "🇺🇿" },
  kk: { native: "Qaraqalpaqsha", flag: "🇺🇿" },
  ru: { native: "Русский", flag: "🇷🇺" },
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Tilni tanlash"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{locale}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => change(l)}
            className="cursor-pointer"
          >
            <span className="mr-2 text-base leading-none">{LABELS[l].flag}</span>
            <span className="flex-1">{LABELS[l].native}</span>
            {l === locale && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
