"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderFeed } from "./order-feed";
import { useMasterMe } from "@/lib/api/master-me-hooks";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Usta uchun "Buyurtmalar" sahifasi — barcha mos buyurtmalar katalogi.
 * Mijoz "Band qilish" yuborgunicha bu yerda ko'rib turish mumkin.
 * Profil to'liq emas bo'lsa /dashboard ga yo'naltiradi.
 */
export function MasterFeedPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading, isError } = useMasterMe();

  useEffect(() => {
    if (user && user.role !== "master") {
      router.replace("/masters");
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="rounded-lg border bg-destructive/5 p-8 text-center">
        <p className="text-destructive font-medium">Profil yuklanmadi</p>
      </div>
    );
  }

  const isProfileIncomplete =
    !profile.bio || profile.categories.length === 0;

  if (isProfileIncomplete) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mos buyurtmalar</h1>
          <p className="text-muted-foreground mt-1">
            Sizning kasbingizga mos kelgan buyurtmalar katalogi
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900 mb-1">
                Avval profilingizni to&apos;ldiring
              </p>
              <p className="text-sm text-amber-800 mb-4">
                Sizga mos buyurtmalar ko&apos;rinishi uchun bio yozing va kamida bitta
                kasb tanlang. Bir nechta kasb egasi bo&apos;lsangiz, hammasini tanlang.
              </p>
              <Button render={<Link href="/dashboard" />}>
                Profilni to&apos;ldirish
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Buyurtmalar katalogi
          </h1>
          <p className="text-muted-foreground mt-1">
            Sizning kasbingiz va hududingizga mos buyurtmalar. Mijoz sizni
            tanlasa, &quot;Kelgan so&apos;rovlar&quot; bo&apos;limida ko&apos;rinasiz.
          </p>
        </div>
        <Link href="/bookings" className="text-sm text-primary hover:underline">
          Kelgan so&apos;rovlarim →
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="text-muted-foreground">Sizning kasblaringiz:</span>
        {profile.categories.map((c) => (
          <span
            key={c.id}
            className="px-2 py-0.5 rounded-full bg-primary/10 text-primary"
          >
            {c.name}
          </span>
        ))}
      </div>

      {!profile.is_available && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-medium text-amber-900">
              Hozir siz &quot;band&quot; holatdasiz
            </p>
            <p className="text-amber-800 mt-0.5">
              Mijozlar yangi so&apos;rov yubora olmaydi. Joriy ishingizni
              yakunlasangiz, yana aktiv bo&apos;lasiz.
            </p>
          </div>
        </div>
      )}

      <OrderFeed />
    </div>
  );
}
