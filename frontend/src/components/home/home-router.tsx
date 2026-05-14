"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { Landing } from "@/components/home/landing";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Bosh sahifa logikasi:
 *  - Kirilmagan foydalanuvchi → Landing
 *  - Usta → /dashboard (mos buyurtmalar yoki profil to'ldirish)
 *  - Mijoz → /masters (ustalar katalogi)
 */
export function HomeRouter() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated || !user) return;
    if (user.role === "master") {
      router.replace("/orders/feed");
    } else if (user.role === "client") {
      router.replace("/masters");
    }
  }, [hydrated, user, router]);

  // Hydration tugamaguncha yoki kirilgan foydalanuvchi redirect qilinmaguncha — loading
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (user) {
    // Redirect qilinishini kutyapmiz
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return <Landing />;
}
