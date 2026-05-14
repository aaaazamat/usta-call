"use client";

import { Bell, Inbox, Send } from "lucide-react";
import { Loader2 } from "lucide-react";

import { ReceivedBookingsList } from "@/components/bookings/received-bookings-list";
import { SentBookingsList } from "@/components/bookings/sent-bookings-list";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Foydalanuvchi roliga qarab tegishli so'rovlarni ko'rsatadi:
 *  - Mijoz → yuborgan so'rovlari
 *  - Usta → kelgan so'rovlari
 */
export function BookingsPage() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated || !user) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const isMaster = user.role === "master";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          {isMaster ? (
            <>
              <Inbox className="h-6 w-6 text-primary" />
              Kelgan so&apos;rovlar
            </>
          ) : (
            <>
              <Send className="h-6 w-6 text-primary" />
              Mening so&apos;rovlarim
            </>
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isMaster
            ? "Mijozlardan kelgan band qilish so'rovlari va davom etayotgan ishlar"
            : "Siz ustalarga yuborgan band qilish so'rovlari"}
        </p>
      </div>

      {isMaster ? <ReceivedBookingsList /> : <SentBookingsList />}
    </div>
  );
}
