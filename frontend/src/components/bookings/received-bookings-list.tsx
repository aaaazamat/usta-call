"use client";

import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAcceptBooking,
  useCompleteBooking,
  useDeclineBooking,
  useMyReceivedBookings,
} from "@/lib/api/bookings-hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { BookingRequest, BookingStatus, Urgency } from "@/lib/api/types";

const STATUS_LABELS: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: "Yangi so'rov", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  accepted: {
    label: "Qabul qilingan",
    cls: "bg-amber-100 text-amber-800 border-amber-200",
  },
  declined: { label: "Rad etilgan", cls: "bg-muted text-muted-foreground" },
  completed: {
    label: "Yakunlangan",
    cls: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "Bekor qilingan",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

const URGENCY_LABELS: Record<Urgency, string> = {
  low: "Shoshilinch emas",
  normal: "Oddiy",
  high: "Tezkor",
  emergency: "Favqulodda",
};

const DATE_FMT = new Intl.DateTimeFormat("uz-UZ", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function ReceivedBookingsList() {
  const { data, isLoading } = useMyReceivedBookings();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-12 text-center">
        <p className="text-base font-medium">Hozircha so&apos;rovlar yo&apos;q</p>
        <p className="text-sm text-muted-foreground mt-1">
          Mijozlar sizga band qilish so&apos;rovi yuborganda, bu yerda ko&apos;rinadi.
        </p>
      </div>
    );
  }

  const pending = data.filter((b) => b.status === "pending");
  const accepted = data.filter((b) => b.status === "accepted");
  const others = data.filter(
    (b) => !["pending", "accepted"].includes(b.status),
  );

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <BookingGroup
          title={`Yangi so'rovlar (${pending.length})`}
          highlight
          bookings={pending}
        />
      )}
      {accepted.length > 0 && (
        <BookingGroup title="Davom etayotgan ishlar" bookings={accepted} />
      )}
      {others.length > 0 && (
        <BookingGroup title="Tarix" bookings={others} dimmed />
      )}
    </div>
  );
}

function BookingGroup({
  title,
  bookings,
  highlight,
  dimmed,
}: {
  title: string;
  bookings: BookingRequest[];
  highlight?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div>
      <h3
        className={
          "text-sm font-semibold mb-3 " +
          (highlight ? "text-primary" : "text-muted-foreground")
        }
      >
        {title}
      </h3>
      <div className={"space-y-3 " + (dimmed ? "opacity-70" : "")}>
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingRequest }) {
  const accept = useAcceptBooking();
  const decline = useDeclineBooking();
  const complete = useCompleteBooking();
  const status = STATUS_LABELS[booking.status];

  const handleAccept = () => {
    if (
      !confirm(
        "Bu so'rovni qabul qilasizmi? Sizning 'aktiv' holatingiz o'chiriladi va boshqa mijozlar sizni topa olmaydi.",
      )
    )
      return;
    accept.mutate(booking.id, {
      onSuccess: () =>
        toast.success("Qabul qilindi. Endi siz band holatdasiz."),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const handleDecline = () => {
    if (!confirm("Bu so'rovni rad etmoqchimisiz?")) return;
    decline.mutate(booking.id, {
      onSuccess: () => toast.success("Rad etildi"),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const handleComplete = () => {
    if (
      !confirm(
        "Ish bajarildimi? Yakunlangach, siz yana 'aktiv' holatga qaytasiz va boshqa mijozlar sizni topa oladi.",
      )
    )
      return;
    complete.mutate(booking.id, {
      onSuccess: () =>
        toast.success("Yakunlandi! Endi siz yana aktivsiz."),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={booking.client.avatar ?? undefined} />
          <AvatarFallback>
            {booking.client.full_name?.[0]?.toUpperCase() ?? "M"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="font-medium">
              {booking.client.full_name || "Mijoz"}
            </div>
            <Badge className={status.cls + " border"}>{status.label}</Badge>
          </div>
          <a
            href={`tel:${booking.client.phone}`}
            className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
          >
            <Phone className="h-3.5 w-3.5" />
            {booking.client.phone}
          </a>
        </div>
      </div>

      <Link
        href={`/orders/${booking.order.id}`}
        className="block rounded-lg border bg-muted/30 p-3 mb-3 hover:bg-muted/50 transition"
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-medium text-sm line-clamp-1">{booking.order.title}</div>
          <span className="text-xs text-muted-foreground shrink-0">
            #{booking.order.id}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
          {booking.order.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {booking.order.address}
          </span>
          <span>{URGENCY_LABELS[booking.order.urgency]}</span>
          {booking.order.category && (
            <Badge variant="outline" className="font-normal">
              {booking.order.category.name}
            </Badge>
          )}
        </div>
      </Link>

      {booking.note && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5 mb-3 text-sm">
          <span className="font-medium text-amber-900">Mijoz xabari: </span>
          <span className="text-amber-900/90">{booking.note}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {DATE_FMT.format(new Date(booking.created_at))}
        </span>

        {booking.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={accept.isPending}
            >
              {accept.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Qabul qilish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecline}
              disabled={decline.isPending}
              className="text-destructive"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Rad etish
            </Button>
          </div>
        )}

        {booking.status === "accepted" && (
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={complete.isPending}
          >
            {complete.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            Ishni yakunlash
          </Button>
        )}
      </div>
    </div>
  );
}
