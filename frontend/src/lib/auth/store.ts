import { create } from "zustand";

import type { AuthTokens, User } from "@/lib/api/types";
import { tokenStorage } from "@/lib/auth/tokens";

interface AuthState {
  user: User | null;
  hydrated: boolean;
  setUser: (user: User | null) => void;
  setSession: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setSession: (tokens, user) => {
    tokenStorage.set(tokens);
    set({ user });
  },
  logout: () => {
    tokenStorage.clear();
    set({ user: null });
  },
  markHydrated: () => set({ hydrated: true }),
}));
