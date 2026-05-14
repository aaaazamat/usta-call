import { api } from "@/lib/api/client";
import type { Paginated, Review } from "@/lib/api/types";

export interface ReviewListParams {
  master?: number;
  rating?: number;
  ordering?: string;
  page?: number;
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
};
