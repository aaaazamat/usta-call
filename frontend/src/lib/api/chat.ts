import { api } from "@/lib/api/client";
import type { ChatMessage, ChatRoom, Paginated } from "@/lib/api/types";

export const chatApi = {
  rooms: () =>
    api.get<Paginated<ChatRoom> | ChatRoom[]>("/chat/rooms/").then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : d.results;
    }),

  room: (roomId: number) =>
    api.get<ChatRoom>(`/chat/rooms/${roomId}/`).then((r) => r.data),

  messages: (roomId: number) =>
    api
      .get<Paginated<ChatMessage> | ChatMessage[]>(`/chat/rooms/${roomId}/messages/`)
      .then((r) => {
        const d = r.data;
        return Array.isArray(d) ? d : d.results;
      }),

  sendMessage: (roomId: number, payload: { text?: string; attachment?: File }) => {
    if (payload.attachment) {
      const fd = new FormData();
      if (payload.text) fd.append("text", payload.text);
      fd.append("attachment", payload.attachment);
      return api
        .post<ChatMessage>(`/chat/rooms/${roomId}/messages/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    }
    return api
      .post<ChatMessage>(`/chat/rooms/${roomId}/messages/`, { text: payload.text })
      .then((r) => r.data);
  },

  markRead: (roomId: number) =>
    api.post<{ detail: string }>(`/chat/rooms/${roomId}/read/`).then((r) => r.data),
};
