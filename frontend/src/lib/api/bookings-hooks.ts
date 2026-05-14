"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { bookingsApi } from "@/lib/api/bookings";
import type { BookingCreatePayload } from "@/lib/api/types";

export const bookingsKeys = {
  all: ["bookings"] as const,
  mySent: () => [...bookingsKeys.all, "my-sent"] as const,
  myReceived: () => [...bookingsKeys.all, "my-received"] as const,
};

export function useMySentBookings() {
  return useQuery({
    queryKey: bookingsKeys.mySent(),
    queryFn: () => bookingsApi.mySent(),
  });
}

export function useMyReceivedBookings() {
  return useQuery({
    queryKey: bookingsKeys.myReceived(),
    queryFn: () => bookingsApi.myReceived(),
    refetchInterval: 60_000, // har 60 soniyada yangilash
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookingCreatePayload) => bookingsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.mySent() });
    },
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
}

export function useAcceptBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookingsApi.accept(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeclineBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookingsApi.decline(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useCompleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookingsApi.complete(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookingsApi.cancel(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}
