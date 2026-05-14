import Link from "next/link";
import { Briefcase, MapPin, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { MasterListItem } from "@/lib/api/types";

function formatRate(from: string | null, to: string | null): string | null {
  if (!from && !to) return null;
  const fmt = (v: string) => Number(v).toLocaleString("uz-UZ");
  if (from && to) return `${fmt(from)} – ${fmt(to)} so'm/soat`;
  if (from) return `${fmt(from)} so'm/soat`;
  return `${fmt(to!)} so'm/soat`;
}

export function MasterCard({ master }: { master: MasterListItem }) {
  const rating = Number(master.rating_cache);
  const hasRating = master.reviews_count_cache > 0;
  const rate = formatRate(master.hourly_rate_from, master.hourly_rate_to);

  return (
    <Link
      href={`/masters/${master.id}`}
      className="group flex flex-col rounded-xl border bg-card p-5 transition hover:border-foreground/30 hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={master.user.avatar ?? undefined} alt={master.user.full_name} />
          <AvatarFallback className="text-base">
            {master.user.full_name?.[0]?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
            {master.user.full_name || "Usta"}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {hasRating ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-foreground font-medium">{rating.toFixed(1)}</span>
                <span>({master.reviews_count_cache})</span>
              </span>
            ) : (
              <span>Sharhlar yo&apos;q</span>
            )}
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {master.completed_orders_cache} ish
            </span>
          </div>
        </div>
        {master.is_available && (
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            Ochiq
          </Badge>
        )}
      </div>

      {master.bio && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{master.bio}</p>
      )}

      {master.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {master.categories.slice(0, 3).map((c) => (
            <Badge key={c.id} variant="outline" className="font-normal">
              {c.name}
            </Badge>
          ))}
          {master.categories.length > 3 && (
            <Badge variant="outline" className="font-normal">
              +{master.categories.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {master.experience_years > 0 ? `${master.experience_years}+ yil tajriba` : "Yangi usta"}
        </div>
        {rate && <div className="font-medium">{rate}</div>}
      </div>
    </Link>
  );
}

export function MasterCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
      </div>
    </div>
  );
}
