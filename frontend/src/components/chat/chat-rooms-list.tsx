"use client";

import { useLocale, useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useChatRooms } from "@/lib/api/chat-hooks";
import { useAuthStore } from "@/lib/auth/store";
import type { ChatRoom, User } from "@/lib/api/types";

const LOCALE_MAP: Record<string, string> = { uz: "uz-UZ", kk: "uz-UZ", ru: "ru-RU" };

export function ChatRoomsList() {
  const t = useTranslations("chat");
  const currentUser = useAuthStore((s) => s.user);
  const { data: rooms, isLoading } = useChatRooms();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-12 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-base font-medium">{t("noRoomsTitle")}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("noRoomsHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rooms.map((room) => (
        <RoomRow key={room.id} room={room} currentUserId={currentUser?.id ?? 0} />
      ))}
    </div>
  );
}

function RoomRow({ room, currentUserId }: { room: ChatRoom; currentUserId: number }) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const intlLocale = LOCALE_MAP[locale] ?? "uz-UZ";
  const formatRelative = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    return new Intl.DateTimeFormat(
      intlLocale,
      sameDay
        ? { hour: "2-digit", minute: "2-digit" }
        : { month: "short", day: "numeric" },
    ).format(d);
  };
  const peer: User = room.client.id === currentUserId ? room.master : room.client;
  const last = room.last_message;

  return (
    <Link
      href={`/chat/${room.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:border-primary/40 hover:shadow-sm transition"
    >
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={peer.avatar ?? undefined} />
        <AvatarFallback>{peer.full_name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3 className="font-medium truncate">{peer.full_name || peer.phone}</h3>
          {last && (
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelative(last.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground truncate flex-1">
            {last
              ? last.sender.id === currentUserId
                ? `${t("you")}: ${last.text || t("file")}`
                : last.text || t("file")
              : t("newChat")}
          </p>
          {room.unread_count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-medium px-1.5">
              {room.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
