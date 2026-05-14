"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  masterMeApi,
  type MasterProfileUpdate,
  type PortfolioCreatePayload,
} from "@/lib/api/master-me";

export const masterMeKeys = {
  profile: ["masterMe", "profile"] as const,
  portfolio: ["masterMe", "portfolio"] as const,
  feed: ["masterMe", "feed"] as const,
};

export function useMasterMe() {
  return useQuery({
    queryKey: masterMeKeys.profile,
    queryFn: () => masterMeApi.get(),
  });
}

export function useUpdateMasterMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MasterProfileUpdate) => masterMeApi.update(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(masterMeKeys.profile, data);
    },
  });
}

export function useMasterPortfolio() {
  return useQuery({
    queryKey: masterMeKeys.portfolio,
    queryFn: () => masterMeApi.portfolioList(),
  });
}

export function useCreatePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PortfolioCreatePayload) => masterMeApi.portfolioCreate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterMeKeys.portfolio });
      queryClient.invalidateQueries({ queryKey: masterMeKeys.profile });
    },
  });
}

export function useDeletePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => masterMeApi.portfolioDelete(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterMeKeys.portfolio });
      queryClient.invalidateQueries({ queryKey: masterMeKeys.profile });
    },
  });
}

export function useMasterFeed() {
  return useQuery({
    queryKey: masterMeKeys.feed,
    queryFn: () => masterMeApi.feed(),
  });
}
