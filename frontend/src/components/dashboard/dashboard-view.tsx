"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AlertCircle, Briefcase, Loader2, Star, Wrench } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMasterMe } from "@/lib/api/master-me-hooks";
import { useAuthStore } from "@/lib/auth/store";

import { ReceivedBookingsList } from "@/components/bookings/received-bookings-list";

import { PortfolioManager } from "./portfolio-manager";
import { ProfileEditForm } from "./profile-edit-form";

export function DashboardView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading, isError } = useMasterMe();

  // Faqat ustalar uchun
  useEffect(() => {
    if (user && user.role !== "master") {
      router.replace("/profile");
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
        <p className="text-destructive">Profil yuklanmadi</p>
        <p className="text-sm text-muted-foreground mt-2">
          Faqat usta rolidagi foydalanuvchilar uchun mavjud
        </p>
      </div>
    );
  }

  const isProfileIncomplete =
    !profile.bio || profile.categories.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Usta paneli</h1>
          <p className="text-muted-foreground mt-1">
            {isProfileIncomplete
              ? "Avvalo o'zingiz haqingizda ma'lumotlarni to'ldiring"
              : "Profilingizni boshqaring va yangi buyurtmalarni ko'ring"}
          </p>
        </div>
        {!isProfileIncomplete && (
          <Link
            href={`/masters/${profile.id}`}
            className="text-sm text-primary hover:underline"
          >
            Profilingiz mijozlarga qanday ko&apos;rinadi →
          </Link>
        )}
      </div>

      {isProfileIncomplete && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">
              Profilingiz hali to&apos;liq emas
            </p>
            <p className="text-amber-800 mt-1">
              Mijozlar sizni topishi va buyurtmalar ko&apos;rinishi uchun:
              bio yozing, kasb (kategoriya) tanlang. Bir nechta kasb tanlasangiz
              ham bo&apos;ladi.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Star className="h-4 w-4" />}
          label="Reyting"
          value={
            profile.reviews_count_cache > 0
              ? Number(profile.rating_cache).toFixed(1)
              : "—"
          }
          sub={`${profile.reviews_count_cache} sharh`}
        />
        <StatCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Bajarilgan"
          value={String(profile.completed_orders_cache)}
          sub="ish"
        />
        <StatCard
          icon={<Wrench className="h-4 w-4" />}
          label="Kategoriyalar"
          value={String(profile.categories.length)}
          sub="tanlangan"
        />
        <StatCard
          icon={<AlertCircle className="h-4 w-4" />}
          label="Holat"
          value={profile.is_available ? "Ochiq" : "Yopiq"}
          sub={profile.is_available ? "Ish qabul qilamiz" : "Ish qabul qilmaymiz"}
          highlight={profile.is_available}
        />
      </div>

      <Tabs
        defaultValue={isProfileIncomplete ? "profile" : "bookings"}
        className="space-y-5"
      >
        <TabsList>
          <TabsTrigger value="bookings">Kelgan so&apos;rovlar</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="portfolio">
            Portfolio ({profile.portfolio.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileEditForm profile={profile} />
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioManager />
        </TabsContent>

        <TabsContent value="bookings">
          <ReceivedBookingsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          {icon}
          {label}
        </div>
        <div
          className={
            "text-2xl font-bold " + (highlight ? "text-green-600" : "")
          }
        >
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}
