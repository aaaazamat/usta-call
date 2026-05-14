import { api } from "@/lib/api/client";
import type { BookingCreatePayload, BookingRequest } from "@/lib/api/types";

export const bookingsApi = {
  create: (payload: BookingCreatePayload) =>
    api.post<BookingRequest>("/bookings/", payload).then((r) => r.data),

  mySent: () =>
    api.get<BookingRequest[]>("/bookings/my-sent/").then((r) => r.data),

  myReceived: () =>
    api.get<BookingRequest[]>("/bookings/my-received/").then((r) => r.data),

  accept: (id: number) =>
    api.post<BookingRequest>(`/bookings/${id}/accept/`).then((r) => r.data),

  decline: (id: number) =>
    api.post<BookingRequest>(`/bookings/${id}/decline/`).then((r) => r.data),

  complete: (id: number) =>
    api.post<BookingRequest>(`/bookings/${id}/complete/`).then((r) => r.data),

  cancel: (id: number) =>
    api.post<BookingRequest>(`/bookings/${id}/cancel/`).then((r) => r.data),
};
