"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { chatApi } from "@/lib/api/chat";

export const chatKeys = {
  all: ["chat"] as const,
  rooms: () => [...chatKeys.all, "rooms"] as const,
  room: (id: number) => [...chatKeys.all, "room", id] as const,
  messages: (id: number) => [...chatKeys.all, "messages", id] as const,
};

export function useChatRooms() {
  return useQuery({
    queryKey: chatKeys.rooms(),
    queryFn: () => chatApi.rooms(),
    refetchInterval: 30_000,
  });
}

export function useChatRoom(roomId: number) {
  return useQuery({
    queryKey: chatKeys.room(roomId),
    queryFn: () => chatApi.room(roomId),
    enabled: Number.isFinite(roomId),
  });
}

export function useChatMessages(roomId: number) {
  return useQuery({
    queryKey: chatKeys.messages(roomId),
    queryFn: () => chatApi.messages(roomId),
    enabled: Number.isFinite(roomId),
  });
}

export function useMarkRead(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.markRead(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}
