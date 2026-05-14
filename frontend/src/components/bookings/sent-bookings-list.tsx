"use client";

import Link from "next/link";
import { Calendar, Loader2, Phone, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCancelBooking,
  useMySentBookings,
} from "@/lib/api/bookings-hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { BookingRequest, BookingStatus } from "@/lib/api/types";

const STATUS_LABELS: Record<BookingStatus, { label: string; cls: string }> = {
  pending: {
    label: "Javob kutilmoqda",
    cls: "bg-blue-100 text-blue-800 border-blue-200",
  },
  accepted: {
    label: "Usta qabul qildi",
    cls: "bg-amber-100 text-amber-800 border-amber-200",
  },
  declined: {
    label: "Usta rad etdi",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
  },
  completed: {
    label: "Yakunlangan",
    cls: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "Bekor qilingan",
    cls: "bg-muted text-muted-foreground",
  },
};

const DATE_FMT = new Intl.DateTimeFormat("uz-UZ", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function SentBookingsList() {
  const { data, isLoading } = useMySentBookings();

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
        <p className="text-base font-medium">Hali so&apos;rovlar yo&apos;q</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Buyurtma yarating, AI sizga ustalarni tavsiya qiladi va shu yerdan
          band qila olasiz.
        </p>
        <Button render={<Link href="/orders/new" />}>Buyurtma yaratish</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((b) => (
        <SentBookingCard key={b.id} booking={b} />
      ))}
    </div>
  );
}

function SentBookingCard({ booking }: { booking: BookingRequest }) {
  const cancel = useCancelBooking();
  const status = STATUS_LABELS[booking.status];

  const handleCancel = () => {
    if (!confirm("Bu so'rovni bekor qilmoqchimisiz?")) return;
    cancel.mutate(booking.id, {
      onSuccess: () => toast.success("Bekor qilindi"),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const canCancel =
    booking.status === "pending" || booking.status === "accepted";

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/masters/${booking.master.id}`} className="shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={booking.master.user.avatar ?? undefined} />
              <AvatarFallback>
                {booking.master.user.full_name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <Link
              href={`/masters/${booking.master.id}`}
              className="font-semibold hover:underline truncate block"
            >
              {booking.master.user.full_name || "Usta"}
            </Link>
            {(booking.status === "accepted" || booking.status === "completed") && (
              <a
                href={`tel:${booking.master.user.phone}`}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <Phone className="h-3.5 w-3.5" />
                {booking.master.user.phone}
              </a>
            )}
          </div>
        </div>
        <Badge className={status.cls + " border"}>{status.label}</Badge>
      </div>

      <Link
        href={`/orders/${booking.order.id}`}
        className="block rounded-lg border bg-muted/30 p-3 mb-3 hover:bg-muted/50 transition"
      >
        <div className="font-medium text-sm line-clamp-1 mb-0.5">
          {booking.order.title}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {booking.order.description}
        </p>
      </Link>

      {booking.note && (
        <div className="text-xs text-muted-foreground mb-3">
          <span className="font-medium">Sizning eslatmangiz: </span>
          {booking.note}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {DATE_FMT.format(new Date(booking.created_at))}
        </span>

        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={cancel.isPending}
            className="text-destructive"
          >
            {cancel.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
            )}
            So&apos;rovni bekor qilish
          </Button>
        )}
      </div>
    </div>
  );
}
