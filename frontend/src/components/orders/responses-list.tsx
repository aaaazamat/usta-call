"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, Clock, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import {
  useAcceptOrderResponse,
  useOrderResponses,
} from "@/lib/api/orders-hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { OrderResponse } from "@/lib/api/types";

const LOCALE_MAP: Record<string, string> = { uz: "uz-UZ", kk: "uz-UZ", ru: "ru-RU" };

interface Props {
  orderId: number;
  /** Buyurtma egasi ko'rmoqda — qabul qilish tugmasi ko'rinadi */
  canAccept: boolean;
}

export function ResponsesList({ orderId, canAccept }: Props) {
  const t = useTranslations("orders.responsesList");
  const { data: responses, isLoading } = useOrderResponses(orderId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!responses || responses.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {responses.map((resp) => (
        <ResponseCard
          key={resp.id}
          response={resp}
          orderId={orderId}
          canAccept={canAccept}
        />
      ))}
    </div>
  );
}

function ResponseCard({
  response,
  orderId,
  canAccept,
}: {
  response: OrderResponse;
  orderId: number;
  canAccept: boolean;
}) {
  const t = useTranslations("orders.responsesList");
  const locale = useLocale();
  const dateFmt = new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? "uz-UZ", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const formatMoney = (value: string): string =>
    Number(value).toLocaleString(LOCALE_MAP[locale] ?? "uz-UZ") + " " + t("moneySuffix");
  const accept = useAcceptOrderResponse(orderId);
  const rating = Number(response.master.rating_cache);

  const handleAccept = () => {
    const name = response.master.user.full_name || t("thisMaster");
    if (!confirm(t("confirmSelect", { name }))) return;
    accept.mutate(response.id, {
      onSuccess: () => toast.success(t("masterSelected")),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const statusBadge =
    response.status === "accepted" ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <Check className="h-3 w-3 mr-1" /> {t("accepted")}
      </Badge>
    ) : response.status === "rejected" ? (
      <Badge variant="outline" className="text-muted-foreground">
        {t("rejected")}
      </Badge>
    ) : response.status === "withdrawn" ? (
      <Badge variant="outline" className="text-muted-foreground">
        {t("withdrawn")}
      </Badge>
    ) : null;

  return (
    <div
      className={
        "rounded-xl border p-5 transition " +
        (response.status === "accepted"
          ? "border-green-300 bg-green-50/50"
          : response.status === "rejected"
            ? "bg-muted/30 opacity-70"
            : "bg-card hover:border-primary/40")
      }
    >
      <div className="flex items-start gap-4">
        <Link href={`/masters/${response.master.id}`} className="shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={response.master.user.avatar ?? undefined} />
            <AvatarFallback>
              {response.master.user.full_name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
            <Link
              href={`/masters/${response.master.id}`}
              className="font-semibold hover:underline"
            >
              {response.master.user.full_name || t("master")}
            </Link>
            {statusBadge}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
            {response.master.reviews_count_cache > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-foreground font-medium">
                  {rating.toFixed(1)}
                </span>
                <span>({response.master.reviews_count_cache})</span>
              </span>
            ) : (
              <span>{t("newMaster")}</span>
            )}
            <span>{t("workDone", { count: response.master.completed_orders_cache })}</span>
            <span>{dateFmt.format(new Date(response.created_at))}</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 mb-2">
            <span className="text-xl font-bold">{formatMoney(response.price_offer)}</span>
            {response.eta_hours != null && (
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t("etaHours", { hours: response.eta_hours })}
              </span>
            )}
          </div>

          {response.message && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {response.message}
            </p>
          )}

          {canAccept && response.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleAccept} disabled={accept.isPending}>
                {accept.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                )}
                {t("selectThisMaster")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/masters/${response.master.id}`} />}
              >
                {t("viewProfile")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
