"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import {
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MapPin,
  Plus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { useMyOrders } from "@/lib/api/orders-hooks";
import type { OrderListItem, OrderStatus, Urgency } from "@/lib/api/types";

const STATUS_CLS: Record<OrderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-blue-100 text-blue-800 border-blue-200",
  matched: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-indigo-100 text-indigo-800 border-indigo-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

const LOCALE_MAP: Record<string, string> = { uz: "uz-UZ", kk: "uz-UZ", ru: "ru-RU" };

type StatusFilter = "all" | OrderStatus;

export function MyOrdersList() {
  const router = useRouter();
  const t = useTranslations("orders");
  const tl = useTranslations("orders.list");
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const statusFilter = (searchParams.get("status") ?? "all") as StatusFilter;

  const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: tl("all") },
    { value: "published", label: t("status.published") },
    { value: "matched", label: t("status.matched") },
    { value: "completed", label: t("status.completed") },
    { value: "cancelled", label: t("status.cancelled") },
  ];

  const { data, isLoading } = useMyOrders(page === 1 ? undefined : page);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data.results;
    return data.results.filter((o) => o.status === statusFilter);
  }, [data, statusFilter]);

  const updateUrl = useCallback(
    (patch: { status?: StatusFilter; page?: number }) => {
      const usp = new URLSearchParams(searchParams.toString());
      if (patch.status !== undefined) {
        if (patch.status === "all") usp.delete("status");
        else usp.set("status", patch.status);
      }
      if (patch.page !== undefined) {
        if (patch.page <= 1) usp.delete("page");
        else usp.set("page", String(patch.page));
      }
      const qs = usp.toString();
      router.replace(`/orders${qs ? "?" + qs : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: data?.results.length ?? 0,
      draft: 0,
      published: 0,
      matched: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const o of data?.results ?? []) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tl("myTitle")}</h1>
          <p className="text-muted-foreground mt-1">
            {data ? tl("ordersCount", { count: data.count }) : tl("listSubtitle")}
          </p>
        </div>
        <Button render={<Link href="/orders/new" />}>
          <Plus className="h-4 w-4 mr-2" /> {tl("newOrder")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2 -mx-1 px-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => updateUrl({ status: tab.value, page: 1 })}
            className={
              "px-3 py-1.5 rounded-full text-sm border transition whitespace-nowrap " +
              (statusFilter === tab.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border")
            }
          >
            {tab.label}
            {counts[tab.value] > 0 && tab.value !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">{counts[tab.value]}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-12 text-center">
          <p className="text-base font-medium">
            {statusFilter === "all"
              ? tl("noOrdersYet")
              : tl("noOrdersInStatus")}
          </p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {statusFilter === "all"
              ? tl("createFirstHint")
              : tl("tryOtherFilter")}
          </p>
          {statusFilter === "all" && (
            <Button render={<Link href="/orders/new" />}>
              <Plus className="h-4 w-4 mr-2" /> {tl("postOrder")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}

      {data && (data.previous || data.next) && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.previous}
            onClick={() => updateUrl({ page: page - 1 })}
          >
            <ChevronLeft className="h-4 w-4" /> {tl("prev")}
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {tl("pageLabel", { page })}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.next}
            onClick={() => updateUrl({ page: page + 1 })}
          >
            {tl("next")} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: OrderListItem }) {
  const t = useTranslations("orders");
  const tl = useTranslations("orders.list");
  const locale = useLocale();
  const dateFmt = new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? "uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const statusCls = STATUS_CLS[order.status];

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition"
    >
      <div className="flex gap-4">
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-lg overflow-hidden bg-muted">
          {order.cover_image ? (
            <Image
              src={order.cover_image}
              alt={order.title}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="font-semibold line-clamp-1">{order.title}</h3>
            <Badge className={statusCls + " border shrink-0"}>
              {t(`status.${order.status}`)}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {order.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {order.region?.name ?? order.address}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {dateFmt.format(new Date(order.created_at))}
            </span>
            {order.category && (
              <Badge variant="outline" className="font-normal">
                {order.category.name}
              </Badge>
            )}
            <span>{t(`form.urgency.${order.urgency}Label`)}</span>
            {order.responses_count > 0 && (
              <span className="text-foreground font-medium inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {tl("responsesCount", { count: order.responses_count })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
