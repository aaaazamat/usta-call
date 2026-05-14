import { api } from "@/lib/api/client";
import type { MasterDetail, OrderListItem, PortfolioItem } from "@/lib/api/types";

export interface MasterProfileUpdate {
  bio?: string;
  experience_years?: number;
  hourly_rate_from?: string | null;
  hourly_rate_to?: string | null;
  categories?: number[];
  skills?: number[];
  regions?: number[];
  is_available?: boolean;
}

export interface PortfolioCreatePayload {
  title: string;
  description?: string;
  category?: number | null;
  uploaded_images?: File[];
}

function buildPortfolioForm(payload: PortfolioCreatePayload): FormData {
  const fd = new FormData();
  fd.append("title", payload.title);
  if (payload.description) fd.append("description", payload.description);
  if (payload.category != null) fd.append("category", String(payload.category));
  for (const file of payload.uploaded_images ?? []) {
    fd.append("uploaded_images", file);
  }
  return fd;
}

export const masterMeApi = {
  get: () => api.get<MasterDetail>("/masters/me/").then((r) => r.data),

  update: (payload: MasterProfileUpdate) =>
    api.patch<MasterDetail>("/masters/me/", payload).then((r) => r.data),

  portfolioList: () =>
    api.get<PortfolioItem[]>("/masters/me/portfolio/").then((r) => r.data),

  portfolioCreate: (payload: PortfolioCreatePayload) =>
    api
      .post<PortfolioItem>("/masters/me/portfolio/", buildPortfolioForm(payload), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  portfolioDelete: (itemId: number) =>
    api.delete(`/masters/me/portfolio/${itemId}/`),

  feed: () =>
    api.get<OrderListItem[] | { results: OrderListItem[] }>("/orders/feed/").then((r) => {
      // Backend "feed" can return either a plain array (no pagination) or paginated.
      const data = r.data;
      return Array.isArray(data) ? data : data.results ?? [];
    }),
};
