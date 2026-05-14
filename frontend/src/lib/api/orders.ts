import { api } from "@/lib/api/client";
import type {
  OrderCreatePayload,
  OrderDetail,
  OrderListItem,
  OrderMatch,
  OrderResponse,
  OrderResponseCreatePayload,
  Paginated,
} from "@/lib/api/types";

function buildOrderForm(payload: OrderCreatePayload): FormData | Record<string, unknown> {
  const hasImages = payload.uploaded_images && payload.uploaded_images.length > 0;

  if (hasImages) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(payload)) {
      if (k === "uploaded_images") continue;
      if (v === undefined || v === null || v === "") continue;
      fd.append(k, String(v));
    }
    for (const file of payload.uploaded_images!) {
      fd.append("uploaded_images", file);
    }
    return fd;
  }

  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (k === "uploaded_images") continue;
    if (v === undefined || v === null || v === "") continue;
    body[k] = v;
  }
  return body;
}

export const ordersApi = {
  create: (payload: OrderCreatePayload) => {
    const data = buildOrderForm(payload);
    const isMultipart = data instanceof FormData;
    return api
      .post<OrderListItem>("/orders/", data, {
        headers: isMultipart ? { "Content-Type": "multipart/form-data" } : undefined,
      })
      .then((r) => r.data);
  },

  myOrders: (params: { page?: number } = {}) =>
    api
      .get<Paginated<OrderListItem>>("/orders/me/", { params })
      .then((r) => r.data),

  detail: (id: number) =>
    api.get<OrderDetail>(`/orders/${id}/`).then((r) => r.data),

  matches: (id: number) =>
    api.get<OrderMatch[]>(`/orders/${id}/matches/`).then((r) => r.data),

  cancel: (id: number) =>
    api.post<OrderDetail>(`/orders/${id}/cancel/`).then((r) => r.data),

  complete: (id: number) =>
    api.post<OrderDetail>(`/orders/${id}/complete/`).then((r) => r.data),

  acceptResponse: (orderId: number, responseId: number) =>
    api
      .post<OrderDetail>(`/orders/${orderId}/accept/${responseId}/`)
      .then((r) => r.data),

  listResponses: (orderId: number) =>
    api
      .get<OrderResponse[]>(`/orders/${orderId}/responses/`)
      .then((r) => r.data),

  myResponse: (orderId: number) =>
    api
      .get<OrderResponse | null>(`/orders/${orderId}/respond/`)
      .then((r) => r.data),

  sendResponse: (orderId: number, payload: OrderResponseCreatePayload) =>
    api
      .post<OrderResponse>(`/orders/${orderId}/respond/`, payload)
      .then((r) => r.data),
};
