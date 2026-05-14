"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApi, type UpdateMePayload } from "@/lib/api/auth";
import type { Role, User } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";

export const meQueryKey = ["auth", "me"] as const;

export function useMe() {
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: meQueryKey,
    queryFn: async () => {
      const user = await authApi.me();
      setUser(user);
      return user;
    },
    initialData: storeUser ?? undefined,
    staleTime: 60_000,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: UpdateMePayload) => authApi.updateMe(payload),
    onSuccess: (user: User) => {
      setUser(user);
      queryClient.setQueryData(meQueryKey, user);
    },
  });
}

export function useSwitchRole() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (role: Exclude<Role, "admin">) => authApi.switchRole(role),
    onSuccess: (user: User) => {
      setUser(user);
      queryClient.setQueryData(meQueryKey, user);
    },
  });
}
