import {
  Bath,
  Brush,
  Car,
  Hammer,
  Laptop,
  Leaf,
  Lightbulb,
  Scissors,
  Snowflake,
  Sparkles,
  Sofa,
  Wrench,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

/** Kategoriya slug'iga qarab tegishli ikona va rang qaytaradi */
export const CATEGORY_ICONS: Record<
  string,
  { icon: LucideIcon; color: string; bg: string }
> = {
  santexnik: {
    icon: Bath,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  elektrik: {
    icon: Lightbulb,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  quruvchi: {
    icon: Hammer,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  boyoqchi: {
    icon: Brush,
    color: "text-pink-600",
    bg: "bg-pink-50 dark:bg-pink-950/30",
  },
  klimatchi: {
    icon: Snowflake,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  "avto-usta": {
    icon: Car,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
  "kompyuter-ustasi": {
    icon: Laptop,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  tikuvchi: {
    icon: Scissors,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  "tozalash-xizmati": {
    icon: Sparkles,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  bogbon: {
    icon: Leaf,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  mebelchi: {
    icon: Sofa,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
  },
};

const DEFAULT_ICON = {
  icon: Wrench,
  color: "text-slate-600",
  bg: "bg-slate-100 dark:bg-slate-800/30",
};

export function getCategoryIcon(slug: string | undefined | null) {
  if (!slug) return DEFAULT_ICON;
  return CATEGORY_ICONS[slug] ?? DEFAULT_ICON;
}
