"use client";

import { useTranslations } from "next-intl";
import { Briefcase, MapPin, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { getCategoryIcon } from "@/lib/category-icons";
import type { MasterListItem } from "@/lib/api/types";

function formatRate(
  from: string | null,
  to: string | null,
  perHour: (amount: string) => string,
): string | null {
  if (!from && !to) return null;
  const fmt = (v: string) => Number(v).toLocaleString("uz-UZ");
  if (from && to) return perHour(`${fmt(from)} – ${fmt(to)}`);
  if (from) return perHour(fmt(from));
  return perHour(fmt(to!));
}

export function MasterCard({ master }: { master: MasterListItem }) {
  const t = useTranslations("masters");
  const rating = Number(master.rating_cache);
  const hasRating = master.reviews_count_cache > 0;
  const rate = formatRate(master.hourly_rate_from, master.hourly_rate_to, (amount) =>
    t("ratePerHour", { amount }),
  );

  return (
    <Link
      href={`/masters/${master.id}`}
      className="card-lift group flex flex-col rounded-2xl border bg-card p-5 relative overflow-hidden"
    >
      {/* Gradient hover accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="h-14 w-14 ring-2 ring-background shadow-sm">
            <AvatarImage src={master.user.avatar ?? undefined} alt={master.user.full_name} />
            <AvatarFallback className="text-base font-medium bg-gradient-to-br from-primary/10 to-purple-500/10">
              {master.user.full_name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          {master.is_available && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
            {master.user.full_name || t("master")}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {hasRating ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-foreground font-semibold">
                  {rating.toFixed(1)}
                </span>
                <span>({master.reviews_count_cache})</span>
              </span>
            ) : (
              <span>{t("noReviews")}</span>
            )}
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {t("workCount", { count: master.completed_orders_cache })}
            </span>
          </div>
        </div>
        {master.is_available && (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 shrink-0"
          >
            {t("open")}
          </Badge>
        )}
      </div>

      {master.bio && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
          {master.bio}
        </p>
      )}

      {master.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {master.categories.slice(0, 3).map((c) => {
            const info = getCategoryIcon(c.slug);
            const Icon = info.icon;
            return (
              <span
                key={c.id}
                className={`inline-flex items-center gap-1 ${info.bg} ${info.color} px-2 py-0.5 rounded-full text-xs font-medium`}
              >
                <Icon className="h-3 w-3" />
                {c.name}
              </span>
            );
          })}
          {master.categories.length > 3 && (
            <span className="inline-flex items-center bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
              +{master.categories.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <MapPin className="h-3.5 w-3.5" />
          {master.experience_years > 0
            ? t("experienceYears", { years: master.experience_years })
            : t("newMaster")}
        </div>
        {rate && <div className="font-semibold text-sm">{rate}</div>}
      </div>
    </Link>
  );
}

export function MasterCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-muted shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-muted rounded shimmer" />
          <div className="h-3 w-1/2 bg-muted rounded shimmer" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full bg-muted rounded shimmer" />
        <div className="h-3 w-5/6 bg-muted rounded shimmer" />
      </div>
    </div>
  );
}
