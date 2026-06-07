"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Sparkles,
  Star,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookMasterDialog } from "@/components/bookings/book-master-dialog";
import { Link, useRouter } from "@/i18n/navigation";
import { ordersApi } from "@/lib/api/orders";
import {
  useOrderDetail,
  useOrderMatches,
  ordersKeys,
} from "@/lib/api/orders-hooks";
import { useMySentBookings } from "@/lib/api/bookings-hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { MasterListItem, OrderStatus } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";

const STATUS_CLS: Record<OrderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-blue-100 text-blue-800 border-blue-200",
  matched: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-indigo-100 text-indigo-800 border-indigo-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

const URGENCY_CLS: Record<string, string> = {
  low: "",
  normal: "",
  high: "text-orange-700",
  emergency: "text-destructive font-semibold",
};

const LOCALE_MAP: Record<string, string> = { uz: "uz-UZ", kk: "uz-UZ", ru: "ru-RU" };

export function OrderDetailView({ orderId }: { orderId: number }) {
  const router = useRouter();
  const t = useTranslations("orders");
  const td = useTranslations("orders.detail");
  const locale = useLocale();
  const intlLocale = LOCALE_MAP[locale] ?? "uz-UZ";
  const dateFmt = new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const formatMoney = (value: string): string =>
    Number(value).toLocaleString(intlLocale) + " " + td("moneySuffix");
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data: order, isLoading, isError } = useOrderDetail(orderId);
  const isOwner = order && currentUser && order.client.id === currentUser.id;

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId),
    onSuccess: () => {
      toast.success(td("cancelled"));
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading) return <OrderDetailSkeleton />;

  if (isError || !order) {
    return (
      <div className="rounded-lg border bg-destructive/5 p-8 text-center">
        <p className="text-destructive font-medium">{td("notFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          {td("backHome")}
        </Button>
      </div>
    );
  }

  const statusCls = STATUS_CLS[order.status];
  const urgencyCls = URGENCY_CLS[order.urgency];
  const canShowMatches =
    isOwner && (order.status === "published" || order.status === "matched");

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusCls + " border"}>{t(`status.${order.status}`)}</Badge>
              {order.category && <Badge variant="outline">{order.category.name}</Badge>}
              <span className={"text-sm " + urgencyCls}>
                {t(`form.urgency.${order.urgency}Label`)}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{order.title}</h1>
          </div>
          {isOwner &&
            (order.status === "published" || order.status === "matched") && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm(td("cancelConfirm"))) cancelMutation.mutate();
                }}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" /> {td("cancelOrder")}
              </Button>
            )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 rounded-xl border bg-card p-5 text-sm">
          <InfoRow icon={<MapPin className="h-4 w-4" />} label={td("address")}>
            {order.address}
            {order.region && (
              <span className="text-muted-foreground"> · {order.region.name}</span>
            )}
          </InfoRow>
          <InfoRow icon={<Calendar className="h-4 w-4" />} label={td("createdAt")}>
            {dateFmt.format(new Date(order.created_at))}
          </InfoRow>
          {(order.budget_from || order.budget_to) && (
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label={td("budget")}>
              {order.budget_from && order.budget_to
                ? `${formatMoney(order.budget_from)} – ${formatMoney(order.budget_to)}`
                : order.budget_from
                  ? td("budgetFromOnly", { amount: formatMoney(order.budget_from) })
                  : td("budgetToOnly", { amount: formatMoney(order.budget_to!) })}
            </InfoRow>
          )}
        </div>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">{td("description")}</h2>
        <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-xl border bg-card p-5">
          {order.description}
        </p>
      </section>

      {order.images.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">{td("imagesTitle")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {order.images.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                <Image
                  src={img.image}
                  alt={td("orderImage")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {order.ai_summary && (
        <section className="rounded-xl border bg-primary/5 border-primary/20 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
            <Sparkles className="h-4 w-4" /> {td("aiSummary")}
          </div>
          <p className="text-sm">{order.ai_summary}</p>
          {order.ai_extracted_skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {order.ai_extracted_skills.map((s) => (
                <Badge key={s.id} variant="secondary">
                  {s.name}
                </Badge>
              ))}
            </div>
          )}
        </section>
      )}

      {order.selected_master && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {td("selectedMaster")}
          </h2>
          <Link
            href={`/masters/${order.selected_master.id}`}
            className="block rounded-xl border bg-green-50 border-green-200 p-5 hover:bg-green-100/50 transition"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={order.selected_master.user.avatar ?? undefined} />
                <AvatarFallback>
                  {order.selected_master.user.full_name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">
                  {order.selected_master.user.full_name || td("master")}
                </div>
                <a
                  href={`tel:${order.selected_master.user.phone}`}
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {order.selected_master.user.phone}
                </a>
              </div>
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </Link>
        </section>
      )}

      {canShowMatches && (
        <OrderMatchesSection orderId={orderId} orderTitle={order.title} />
      )}
    </div>
  );
}

function OrderMatchesSection({
  orderId,
  orderTitle,
}: {
  orderId: number;
  orderTitle: string;
}) {
  const td = useTranslations("orders.detail");
  const { data: matches, isLoading } = useOrderMatches(orderId);
  const { data: sentBookings } = useMySentBookings();

  // Bu buyurtma uchun yuborilgan band qilish so'rovlar (master_id bo'yicha)
  const bookedMasterIds = new Set(
    (sentBookings ?? [])
      .filter((b) => b.order.id === orderId)
      .map((b) => b.master.id),
  );

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{td("aiRecommended")}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !matches || matches.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          {td("analyzing")}
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <MatchCard
              key={match.master.id}
              master={match.master}
              score={match.score}
              reason={match.reason}
              orderId={orderId}
              alreadyBooked={bookedMasterIds.has(match.master.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MatchCard({
  master,
  score,
  reason,
  orderId,
  alreadyBooked,
}: {
  master: MasterListItem;
  score: string;
  reason: string;
  orderId: number;
  alreadyBooked: boolean;
}) {
  const td = useTranslations("orders.detail");
  const [bookOpen, setBookOpen] = useState(false);
  const scoreNum = Number(score);
  const rating = Number(master.rating_cache);
  // Ball backend'da allaqachon 0..100 shkalada — to'g'ridan-to'g'ri foiz sifatida
  const scorePercent = Math.min(100, Math.max(0, Math.round(scoreNum)));

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start gap-4">
        <Link href={`/masters/${master.id}`} className="shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={master.user.avatar ?? undefined} />
            <AvatarFallback>
              {master.user.full_name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href={`/masters/${master.id}`}
              className="font-semibold hover:underline"
            >
              {master.user.full_name || td("master")}
            </Link>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/30">
                {td("matchPercent", { percent: scorePercent })}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {master.reviews_count_cache > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-foreground font-medium">{rating.toFixed(1)}</span>
                <span>({master.reviews_count_cache})</span>
              </span>
            ) : (
              <span>{td("noReviews")}</span>
            )}
            <span>{td("workDone", { count: master.completed_orders_cache })}</span>
            {master.experience_years > 0 && (
              <span>{td("expYears", { years: master.experience_years })}</span>
            )}
            {!master.is_available && (
              <span className="text-amber-700 font-medium">· {td("busyNow")}</span>
            )}
          </div>

          {reason && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{reason}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {alreadyBooked ? (
              <Badge variant="secondary" className="text-sm py-1.5 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                {td("requestSent")}
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => setBookOpen(true)}
                disabled={!master.is_available}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                {master.is_available ? td("bookNow") : td("busyNow")}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              render={
                <a
                  href={`tel:${master.user.phone}`}
                  aria-label={td("call")}
                />
              }
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" /> {td("call")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              render={<Link href={`/masters/${master.id}`} />}
            >
              {td("viewProfile")}
            </Button>
          </div>
        </div>
      </div>

      <BookMasterDialog
        masterId={master.id}
        masterName={master.user.full_name || td("master")}
        open={bookOpen}
        onOpenChange={setBookOpen}
        preselectedOrderId={orderId}
      />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{children}</div>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
