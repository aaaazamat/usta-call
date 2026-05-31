"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  reviewsApi,
  type CreateReviewPayload,
  type ReviewListParams,
} from "@/lib/api/reviews";

export const reviewsKeys = {
  all: ["reviews"] as const,
  list: (params: ReviewListParams) => [...reviewsKeys.all, "list", params] as const,
  eligible: (master: number) => [...reviewsKeys.all, "eligible", master] as const,
};

export function useReviews(params: ReviewListParams) {
  return useQuery({
    queryKey: reviewsKeys.list(params),
    queryFn: () => reviewsApi.list(params),
    placeholderData: keepPreviousData,
    enabled: params.master !== undefined,
  });
}

/** Joriy mijoz shu usta uchun sharh yoza oladimi. `enabled` faqat client uchun true. */
export function useReviewEligibility(master: number, enabled: boolean) {
  return useQuery({
    queryKey: reviewsKeys.eligible(master),
    queryFn: () => reviewsApi.eligible(master),
    enabled,
  });
}

export function useCreateReview(master: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsApi.create(payload),
    onSuccess: () => {
      // Sharhlar ro'yxati, eligibility va usta detali (reyting) yangilanadi
      qc.invalidateQueries({ queryKey: reviewsKeys.all });
      qc.invalidateQueries({ queryKey: reviewsKeys.eligible(master) });
      qc.invalidateQueries({ queryKey: ["masters"] });
    },
  });
}
