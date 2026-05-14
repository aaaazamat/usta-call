"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { mastersApi, type MasterListParams } from "@/lib/api/masters";

export const mastersKeys = {
  all: ["masters"] as const,
  list: (params: MasterListParams) => [...mastersKeys.all, "list", params] as const,
  detail: (id: number) => [...mastersKeys.all, "detail", id] as const,
  categories: () => ["masters", "categories"] as const,
  regions: () => ["masters", "regions"] as const,
};

export function useMasters(params: MasterListParams) {
  return useQuery({
    queryKey: mastersKeys.list(params),
    queryFn: () => mastersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useMasterDetail(id: number) {
  return useQuery({
    queryKey: mastersKeys.detail(id),
    queryFn: () => mastersApi.detail(id),
    enabled: Number.isFinite(id),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: mastersKeys.categories(),
    queryFn: () => mastersApi.categories(),
    staleTime: 10 * 60_000,
  });
}

export function useRegions() {
  return useQuery({
    queryKey: mastersKeys.regions(),
    queryFn: () => mastersApi.regions(),
    staleTime: 10 * 60_000,
  });
}
