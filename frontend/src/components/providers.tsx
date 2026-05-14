"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";

import { authApi } from "@/lib/api/auth";
import { tokenStorage } from "@/lib/auth/tokens";
import { useAuthStore } from "@/lib/auth/store";
import { makeQueryClient } from "@/lib/query/client";
import { Toaster } from "@/components/ui/sonner";

function AuthHydrator() {
  const setUser = useAuthStore((s) => s.setUser);
  const markHydrated = useAuthStore((s) => s.markHydrated);

  useEffect(() => {
    const access = tokenStorage.getAccess();
    if (!access) {
      markHydrated();
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(markHydrated);
  }, [setUser, markHydrated]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      {children}
      <Toaster richColors position="top-right" />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
