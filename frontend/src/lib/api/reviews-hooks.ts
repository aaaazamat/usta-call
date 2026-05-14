"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { reviewsApi, type ReviewListParams } from "@/lib/api/reviews";

export const reviewsKeys = {
  all: ["reviews"] as const,
  list: (params: ReviewListParams) => [...reviewsKeys.all, "list", params] as const,
};

export function useReviews(params: ReviewListParams) {
  return useQuery({
    queryKey: reviewsKeys.list(params),
    queryFn: () => reviewsApi.list(params),
    placeholderData: keepPreviousData,
    enabled: params.master !== undefined,
  });
}
