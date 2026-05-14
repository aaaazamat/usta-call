"use client";

import Link from "next/link";
import { Briefcase, Calendar, ChevronRight, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMasterFeed } from "@/lib/api/master-me-hooks";
import type { OrderListItem, Urgency } from "@/lib/api/types";

const URGENCY_LABELS: Record<Urgency, { label: string; cls: string }> = {
  low: { label: "Shoshilinch emas", cls: "bg-muted" },
  normal: { label: "Oddiy", cls: "bg-blue-100 text-blue-800" },
  high: { label: "Tezkor", cls: "bg-orange-100 text-orange-800" },
  emergency: { label: "Favqulodda", cls: "bg-destructive/10 text-destructive" },
};

const DATE_FMT = new Intl.DateTimeFormat("uz-UZ", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function OrderFeed() {
  const { data, isLoading } = useMasterFeed();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-12 text-center">
        <p className="text-base font-medium">Hozircha mos buyurtmalar yo&apos;q</p>
        <p className="text-sm text-muted-foreground mt-1">
          Yangi buyurtmalar paydo bo&apos;lganda bu yerda ko&apos;rinadi. Profilingizdagi
          kategoriyalar va hududlarni to&apos;ldirganligingizga ishonch hosil qiling.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((order) => (
        <OrderFeedCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderFeedCard({ order }: { order: OrderListItem }) {
  const urgency = URGENCY_LABELS[order.urgency];

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {order.category && <Badge variant="outline">{order.category.name}</Badge>}
          <Badge className={urgency.cls + " border-0"}>{urgency.label}</Badge>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition" />
      </div>

      <h3 className="font-semibold mb-1 line-clamp-1">{order.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {order.description}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {order.region?.name ?? order.address}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {DATE_FMT.format(new Date(order.created_at))}
        </span>
        {(order.budget_from || order.budget_to) && (
          <span className="inline-flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            {order.budget_from && order.budget_to
              ? `${Number(order.budget_from).toLocaleString("uz-UZ")} – ${Number(order.budget_to).toLocaleString("uz-UZ")} so'm`
              : "Byudjet bor"}
          </span>
        )}
        {order.responses_count > 0 && (
          <span className="text-foreground font-medium">
            {order.responses_count} ta taklif
          </span>
        )}
      </div>
    </Link>
  );
}
