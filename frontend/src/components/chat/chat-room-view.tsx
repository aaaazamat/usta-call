"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { chatApi } from "@/lib/api/chat";
import {
  chatKeys,
  useChatMessages,
  useChatRoom,
  useMarkRead,
} from "@/lib/api/chat-hooks";
import { useChatSocket } from "@/lib/chat-socket";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useAuthStore } from "@/lib/auth/store";
import type { ChatMessage, User } from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";

const LOCALE_MAP: Record<string, string> = { uz: "uz-UZ", kk: "uz-UZ", ru: "ru-RU" };

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ChatRoomView({ roomId }: { roomId: number }) {
  const router = useRouter();
  const t = useTranslations("chat");
  const locale = useLocale();
  const intlLocale = LOCALE_MAP[locale] ?? "uz-UZ";
  const dateFmt = new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data: room, isLoading: roomLoading, isError: roomError } = useChatRoom(roomId);
  const { data: initialMessages, isLoading: messagesLoading } = useChatMessages(roomId);
  const markRead = useMarkRead(roomId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  // WebSocket connection
  const { status, sendMessage: wsSend, markRead: wsMarkRead } = useChatSocket(roomId, {
    onMessage: (msg) => {
      setMessages((cur) => {
        if (cur.some((m) => m.id === msg.id)) return cur;
        return [...cur, msg];
      });
      // O'qildi belgisi
      if (currentUser && msg.sender.id !== currentUser.id) {
        wsMarkReadRef.current();
      }
    },
    onOpen: () => {
      // Open paytida o'qilmagan xabarlarni o'qildi deb belgilash
      markRead.mutate();
    },
  });

  // wsMarkRead'ni effekt ichida ishlatish uchun ref
  const wsMarkReadRef = useRef(wsMarkRead);
  wsMarkReadRef.current = wsMarkRead;

  // Auto-scroll xabar qo'shilganda
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Foydalanuvchi sahifani tashlab ketganda o'qilgan deb belgilash
  useEffect(() => {
    return () => {
      markRead.mutate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  if (roomLoading || messagesLoading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (roomError || !room || !currentUser) {
    return (
      <div className="rounded-lg border bg-destructive/5 p-8 text-center">
        <p className="text-destructive font-medium">{t("notFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/chat")}>
          {t("backToList")}
        </Button>
      </div>
    );
  }

  const peer: User = room.client.id === currentUser.id ? room.master : room.client;

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    // WS orqali yuborishga harakat qilish, aks holda REST fallback
    const sentViaWs = wsSend(trimmed);
    setText("");

    if (!sentViaWs) {
      setIsSending(true);
      try {
        const msg = await chatApi.sendMessage(roomId, { text: trimmed });
        setMessages((cur) => (cur.some((m) => m.id === msg.id) ? cur : [...cur, msg]));
      } catch (err) {
        toast.error(getApiErrorMessage(err));
        setText(trimmed);
      } finally {
        setIsSending(false);
      }
    }

    queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-xl border bg-card overflow-hidden">
      <header className="flex items-center gap-3 p-3 border-b bg-card">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/chat" />}
          aria-label={t("back")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={peer.avatar ?? undefined} />
          <AvatarFallback>{peer.full_name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{peer.full_name || peer.phone}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {status === "open" ? (
              <>
                <Wifi className="h-3 w-3 text-green-600" />
                <span>{t("online")}</span>
              </>
            ) : status === "connecting" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{t("connecting")}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-muted-foreground" />
                <span>{t("disconnected")}</span>
              </>
            )}
          </div>
        </div>
        <Link
          href={`/orders/${room.order}`}
          className="text-xs text-primary hover:underline"
        >
          {t("orderLabel", { id: room.order })}
        </Link>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              {t("noMessages")}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const prev = messages[idx - 1];
            const msgDate = new Date(msg.created_at);
            const showDate = !prev || !isSameDay(new Date(prev.created_at), msgDate);
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="text-xs bg-background border rounded-full px-3 py-1 text-muted-foreground">
                      {dateFmt.format(msgDate)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isMine={msg.sender.id === currentUser.id}
                />
              </div>
            );
          })
        )}
      </div>

      <form
        className="flex items-center gap-2 p-3 border-t bg-card"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("typeMessage")}
          className="flex-1 h-10 px-3 rounded-lg border bg-background focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring outline-none text-sm"
          autoFocus
        />
        <Button type="submit" size="icon" disabled={!text.trim() || isSending}>
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const timeFmt = new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? "uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className={"flex " + (isMine ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[75%] rounded-2xl px-3.5 py-2 " +
          (isMine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-background border rounded-bl-sm")
        }
      >
        {message.text && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        )}
        {message.attachment && (
          <a
            href={message.attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline mt-1 inline-block opacity-90"
          >
            {t("file")}
          </a>
        )}
        <div
          className={
            "text-[10px] mt-1 " +
            (isMine ? "text-primary-foreground/70 text-right" : "text-muted-foreground")
          }
        >
          {timeFmt.format(new Date(message.created_at))}
          {isMine && message.read_at && <span className="ml-1">✓✓</span>}
        </div>
      </div>
    </div>
  );
}
