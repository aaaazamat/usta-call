import { api } from "@/lib/api/client";
import type { Paginated, Review } from "@/lib/api/types";

export interface ReviewListParams {
  master?: number;
  rating?: number;
  ordering?: string;
  page?: number;
}

export interface CreateReviewPayload {
  order: number;
  rating: number;
  text?: string;
}

export interface ReviewEligibility {
  can_review: boolean;
  orders: { order_id: number; title: string }[];
}

function cleanParams(p: ReviewListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v as string | number;
  }
  return out;
}

export const reviewsApi = {
  list: (params: ReviewListParams = {}) =>
    api
      .get<Paginated<Review>>("/reviews/", { params: cleanParams(params) })
      .then((r) => r.data),

  // Joriy mijoz shu usta uchun sharh yoza oladimi (yakunlangan, sharhsiz buyurtma)
  eligible: (master: number) =>
    api
      .get<ReviewEligibility>("/reviews/eligible/", { params: { master } })
      .then((r) => r.data),

  // Sharh yaratish (faqat o'sha buyurtma egasi, backend tekshiradi)
  create: (payload: CreateReviewPayload) =>
    api.post<Review>("/reviews/", payload).then((r) => r.data),
};
