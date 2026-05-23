"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  MapPin,
  Phone,
  Star,
  Wrench,
  XCircle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookMasterDialog } from "@/components/bookings/book-master-dialog";
import { useMasterDetail } from "@/lib/api/masters-hooks";
import { useAuthStore } from "@/lib/auth/store";

import { PortfolioGallery } from "./portfolio-gallery";
import { ReviewsList } from "./reviews-list";

function formatRate(from: string | null, to: string | null): string | null {
  if (!from && !to) return null;
  const fmt = (v: string) => Number(v).toLocaleString("uz-UZ");
  if (from && to) return `${fmt(from)} – ${fmt(to)} so'm/soat`;
  if (from) return `${fmt(from)} so'm/soat dan`;
  return `${fmt(to!)} so'm/soat gacha`;
}

export function MasterDetailView({ masterId }: { masterId: number }) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const { data: master, isLoading, isError } = useMasterDetail(masterId);
  const [bookOpen, setBookOpen] = useState(false);

  if (isError) {
    return (
      <div className="rounded-lg border bg-destructive/5 p-8 text-center">
        <p className="text-destructive font-medium">Usta topilmadi</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/masters")}>
          Ustalar ro&apos;yxatiga qaytish
        </Button>
      </div>
    );
  }

  if (isLoading || !master) {
    return <MasterDetailSkeleton />;
  }

  const rating = Number(master.rating_cache);
  const hasRating = master.reviews_count_cache > 0;
  const rate = formatRate(master.hourly_rate_from, master.hourly_rate_to);
  const isMasterRole = currentUser?.role === "master";

  const handleBook = () => {
    if (!currentUser) {
      router.push(`/login?next=/masters/${master.id}`);
      return;
    }
    setBookOpen(true);
  };

  const handleCall = () => {
    if (!currentUser) {
      router.push(`/login?next=/masters/${master.id}`);
      return;
    }
    window.location.href = `tel:${master.user.phone}`;
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="rounded-2xl border bg-gradient-to-br from-primary/5 via-transparent to-transparent p-4 md:p-8">
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-start">
          <Avatar className="h-20 w-20 md:h-28 md:w-28 shrink-0">
            <AvatarImage src={master.user.avatar ?? undefined} alt={master.user.full_name} />
            <AvatarFallback className="text-2xl">
              {master.user.full_name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">
                {master.user.full_name || "Usta"}
              </h1>
              {master.is_available && (
                <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                  Ish qabul qiladi
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {hasRating ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-foreground font-semibold">
                    {rating.toFixed(1)}
                  </span>
                  <span>({master.reviews_count_cache} sharh)</span>
                </span>
              ) : (
                <span>Sharhlar hali yo&apos;q</span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                {master.completed_orders_cache} ish bajargan
              </span>
              {master.experience_years > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {master.experience_years} yil tajriba
                </span>
              )}
            </div>

            {master.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {master.categories.map((c) => (
                  <Badge key={c.id} variant="secondary">
                    {c.name}
                  </Badge>
                ))}
              </div>
            )}

            {rate && (
              <div className="text-base font-semibold pt-1">
                <span className="text-muted-foreground text-sm font-normal mr-2">
                  Narx:
                </span>
                {rate}
              </div>
            )}

            {!isMasterRole && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  size="lg"
                  onClick={handleBook}
                  disabled={!master.is_available}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {master.is_available ? "Band qilish" : "Hozir band"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleCall}
                  className="w-full sm:w-auto"
                >
                  <Phone className="h-4 w-4 mr-2" /> Qo&apos;ng&apos;iroq qilish
                </Button>
              </div>
            )}

            {!master.is_available && !isMasterRole && (
              <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground pt-1">
                <XCircle className="h-4 w-4" />
                Usta hozir boshqa ish bilan band. Yangi so&apos;rovlarni qabul qilmaydi.
              </div>
            )}
          </div>
        </div>
      </header>

      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="about" className="flex-1 sm:flex-initial">
            Haqida
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex-1 sm:flex-initial">
            Portfolio ({master.portfolio.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex-1 sm:flex-initial">
            Sharhlar ({master.reviews_count_cache})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-6">
          {master.bio ? (
            <Section title="Bio">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{master.bio}</p>
            </Section>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground text-center">
              Usta haqida ma&apos;lumot kiritilmagan
            </div>
          )}

          {master.skills.length > 0 && (
            <Section title="Ko'nikmalar" icon={<Wrench className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-1.5">
                {master.skills.map((s) => (
                  <Badge key={s.id} variant="outline">
                    {s.name}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {master.regions.length > 0 && (
            <Section title="Xizmat ko'rsatadigan hududlar" icon={<MapPin className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-1.5">
                {master.regions.map((r) => (
                  <Badge key={r.id} variant="outline">
                    {r.name}
                  </Badge>
                ))}
              </div>
            </Section>
          )}
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioGallery items={master.portfolio} />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsList masterId={master.id} />
        </TabsContent>
      </Tabs>

      <BookMasterDialog
        masterId={master.id}
        masterName={master.user.full_name || "Usta"}
        open={bookOpen}
        onOpenChange={setBookOpen}
      />
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function MasterDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border p-8">
        <div className="flex gap-6">
          <Skeleton className="h-28 w-28 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-4 w-80" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
