"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews } from "@/lib/api/reviews-hooks";

const LOCALE_MAP: Record<string, string> = { uz: "uz-UZ", kk: "uz-UZ", ru: "ru-RU" };

export function ReviewsList({ masterId }: { masterId: number }) {
  const t = useTranslations("masters.detail");
  const locale = useLocale();
  const dateFmt = new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? "uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const { data, isLoading } = useReviews({ master: masterId });
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        {t("noReviews")}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {data.results.map((review) => (
          <div key={review.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.client.avatar ?? undefined} />
                <AvatarFallback>
                  {review.client.full_name?.[0]?.toUpperCase() ?? "K"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">
                    {review.client.full_name || t("client")}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          "h-3.5 w-3.5 " +
                          (i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted")
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {dateFmt.format(new Date(review.created_at))}
                </div>
              </div>
            </div>

            {review.text && <p className="mt-3 text-sm leading-relaxed">{review.text}</p>}

            {review.images.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {review.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setLightbox(img.image)}
                    className="relative h-16 w-16 rounded-md overflow-hidden hover:opacity-80"
                  >
                    <Image
                      src={img.image}
                      alt={t("reviewImage")}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}

            {review.master_reply && (
              <div className="mt-4 pl-4 border-l-2 border-primary/40 bg-primary/5 rounded-r-md p-3">
                <div className="text-xs font-medium text-primary mb-1">
                  {t("masterReply")}
                </div>
                <p className="text-sm leading-relaxed">{review.master_reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={lightbox !== null} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-0">
          {lightbox && (
            <div className="relative aspect-[4/3]">
              <Image
                src={lightbox}
                alt="Sharh rasmi"
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
