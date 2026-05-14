"use client";

import { useEffect, useRef, useState } from "react";

import { tokenStorage } from "@/lib/auth/tokens";
import type { ChatMessage } from "@/lib/api/types";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";

export type ChatSocketStatus = "connecting" | "open" | "closed" | "error";

export interface ChatSocketHandlers {
  onMessage?: (message: ChatMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useChatSocket(roomId: number | null, handlers: ChatSocketHandlers) {
  const [status, setStatus] = useState<ChatSocketStatus>("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (roomId == null) return;
    const token = tokenStorage.getAccess();
    if (!token) {
      setStatus("error");
      return;
    }

    const url = `${WS_URL}/chat/${roomId}/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    socketRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      setStatus("open");
      handlersRef.current.onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && data.message) {
          handlersRef.current.onMessage?.(data.message);
        }
      } catch {
        // Ignore malformed frames
      }
    };

    ws.onerror = () => setStatus("error");

    ws.onclose = () => {
      setStatus("closed");
      handlersRef.current.onClose?.();
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [roomId]);

  const sendMessage = (text: string) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify({ action: "send", text }));
    return true;
  };

  const markRead = () => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ action: "read" }));
  };

  return { status, sendMessage, markRead };
}
