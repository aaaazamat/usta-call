"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
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
import { ordersApi } from "@/lib/api/orders";
import {
  useOrderDetail,
  useOrderMatches,
  ordersKeys,
} from "@/lib/api/orders-hooks";
import { useMySentBookings } from "@/lib/api/bookings-hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { MasterListItem, OrderStatus, Urgency } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";

const STATUS_LABELS: Record<OrderStatus, { label: string; cls: string }> = {
  draft: { label: "Qoralama", cls: "bg-muted text-muted-foreground" },
  published: { label: "Aktiv", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  matched: { label: "Usta tanlandi", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  in_progress: {
    label: "Ish davom etyapti",
    cls: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  completed: {
    label: "Yakunlangan",
    cls: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "Bekor qilingan",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

const URGENCY_LABELS: Record<Urgency, { label: string; cls: string }> = {
  low: { label: "Shoshilinch emas", cls: "" },
  normal: { label: "Oddiy", cls: "" },
  high: { label: "Tezkor", cls: "text-orange-700" },
  emergency: { label: "Favqulodda", cls: "text-destructive font-semibold" },
};

const DATE_FMT = new Intl.DateTimeFormat("uz-UZ", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatMoney(value: string): string {
  return Number(value).toLocaleString("uz-UZ") + " so'm";
}

export function OrderDetailView({ orderId }: { orderId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data: order, isLoading, isError } = useOrderDetail(orderId);
  const isOwner = order && currentUser && order.client.id === currentUser.id;

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId),
    onSuccess: () => {
      toast.success("Buyurtma bekor qilindi");
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading) return <OrderDetailSkeleton />;

  if (isError || !order) {
    return (
      <div className="rounded-lg border bg-destructive/5 p-8 text-center">
        <p className="text-destructive font-medium">Buyurtma topilmadi</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          Bosh sahifaga qaytish
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status];
  const urgencyInfo = URGENCY_LABELS[order.urgency];
  const canShowMatches =
    isOwner && (order.status === "published" || order.status === "matched");

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusInfo.cls + " border"}>{statusInfo.label}</Badge>
              {order.category && <Badge variant="outline">{order.category.name}</Badge>}
              <span className={"text-sm " + urgencyInfo.cls}>{urgencyInfo.label}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{order.title}</h1>
          </div>
          {isOwner &&
            (order.status === "published" || order.status === "matched") && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Buyurtmani bekor qilmoqchimisiz?")) cancelMutation.mutate();
                }}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" /> Buyurtmani bekor qilish
              </Button>
            )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 rounded-xl border bg-card p-5 text-sm">
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Manzil">
            {order.address}
            {order.region && (
              <span className="text-muted-foreground"> · {order.region.name}</span>
            )}
          </InfoRow>
          <InfoRow icon={<Calendar className="h-4 w-4" />} label="Yaratilgan">
            {DATE_FMT.format(new Date(order.created_at))}
          </InfoRow>
          {(order.budget_from || order.budget_to) && (
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Byudjet">
              {order.budget_from && order.budget_to
                ? `${formatMoney(order.budget_from)} – ${formatMoney(order.budget_to)}`
                : order.budget_from
                  ? `${formatMoney(order.budget_from)} dan`
                  : `${formatMoney(order.budget_to!)} gacha`}
            </InfoRow>
          )}
        </div>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Tavsif</h2>
        <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-xl border bg-card p-5">
          {order.description}
        </p>
      </section>

      {order.images.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Rasmlar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {order.images.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                <Image
                  src={img.image}
                  alt="Buyurtma rasmi"
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
            <Sparkles className="h-4 w-4" /> AI tahlili
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
            Tanlangan usta
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
                  {order.selected_master.user.full_name || "Usta"}
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
        <h2 className="text-xl font-bold">AI tavsiya etgan ustalar</h2>
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
          Mos ustalar tahlil qilinmoqda... Bir necha soniyada qayta tekshiring.
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
  const [bookOpen, setBookOpen] = useState(false);
  const scoreNum = Number(score);
  const rating = Number(master.rating_cache);
  const scorePercent = Math.round(scoreNum * 100);

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
              {master.user.full_name || "Usta"}
            </Link>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/30">
                {scorePercent}% mos
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
              <span>Sharhlar yo&apos;q</span>
            )}
            <span>{master.completed_orders_cache} ish bajargan</span>
            {master.experience_years > 0 && (
              <span>{master.experience_years} yil tajriba</span>
            )}
            {!master.is_available && (
              <span className="text-amber-700 font-medium">· Hozir band</span>
            )}
          </div>

          {reason && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{reason}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {alreadyBooked ? (
              <Badge variant="secondary" className="text-sm py-1.5 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                So&apos;rov yuborildi
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => setBookOpen(true)}
                disabled={!master.is_available}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                {master.is_available ? "Band qilish" : "Hozir band"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              render={
                <a
                  href={`tel:${master.user.phone}`}
                  aria-label={`${master.user.full_name} ga qo'ng'iroq`}
                />
              }
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" /> Qo&apos;ng&apos;iroq
            </Button>
            <Button
              size="sm"
              variant="ghost"
              render={<Link href={`/masters/${master.id}`} />}
            >
              Profilni ko&apos;rish
            </Button>
          </div>
        </div>
      </div>

      <BookMasterDialog
        masterId={master.id}
        masterName={master.user.full_name || "Usta"}
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
