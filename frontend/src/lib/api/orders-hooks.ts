"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ordersApi } from "@/lib/api/orders";
import type { OrderCreatePayload, OrderResponseCreatePayload } from "@/lib/api/types";

export const ordersKeys = {
  all: ["orders"] as const,
  me: (page?: number) => [...ordersKeys.all, "me", { page }] as const,
  detail: (id: number) => [...ordersKeys.all, "detail", id] as const,
  matches: (id: number) => [...ordersKeys.all, "matches", id] as const,
  responses: (id: number) => [...ordersKeys.all, "responses", id] as const,
  myResponse: (id: number) => [...ordersKeys.all, "myResponse", id] as const,
};

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrderCreatePayload) => ordersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

export function useMyOrders(page?: number) {
  return useQuery({
    queryKey: ordersKeys.me(page),
    queryFn: () => ordersApi.myOrders({ page }),
  });
}

export function useOrderDetail(id: number) {
  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: () => ordersApi.detail(id),
    enabled: Number.isFinite(id),
  });
}

export function useOrderMatches(id: number) {
  return useQuery({
    queryKey: ordersKeys.matches(id),
    queryFn: () => ordersApi.matches(id),
    enabled: Number.isFinite(id),
  });
}

export function useOrderResponses(orderId: number, enabled = true) {
  return useQuery({
    queryKey: ordersKeys.responses(orderId),
    queryFn: () => ordersApi.listResponses(orderId),
    enabled: enabled && Number.isFinite(orderId),
  });
}

export function useMyOrderResponse(orderId: number, enabled = true) {
  return useQuery({
    queryKey: ordersKeys.myResponse(orderId),
    queryFn: () => ordersApi.myResponse(orderId),
    enabled: enabled && Number.isFinite(orderId),
  });
}

export function useSendOrderResponse(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrderResponseCreatePayload) =>
      ordersApi.sendResponse(orderId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(ordersKeys.myResponse(orderId), data);
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: ordersKeys.responses(orderId) });
    },
  });
}

export function useAcceptOrderResponse(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (responseId: number) => ordersApi.acceptResponse(orderId, responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: ordersKeys.responses(orderId) });
    },
  });
}
