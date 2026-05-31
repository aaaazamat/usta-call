"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  useCreateReview,
  useReviewEligibility,
  useReviews,
} from "@/lib/api/reviews-hooks";
import { useAuthStore } from "@/lib/auth/store";

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

  const hasReviews = !!data && data.results.length > 0;

  return (
    <>
      {/* Sharh yozish formasi — faqat shu usta bilan ishi tugagan mijozga ko'rinadi */}
      <ReviewForm masterId={masterId} />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !hasReviews ? (
        <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          {t("noReviews")}
        </div>
      ) : (
        <div className="space-y-4">
          {data!.results.map((review) => (
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

              {review.text && (
                <p className="mt-3 text-sm leading-relaxed">{review.text}</p>
              )}

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
      )}

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

/**
 * Sharh yozish formasi.
 * Faqat: (1) tizimga kirgan mijoz va (2) shu usta bilan yakunlangan, hali
 * sharhsiz buyurtmasi bor bo'lsa ko'rsatiladi. Aks holda hech narsa ko'rinmaydi.
 */
function ReviewForm({ masterId }: { masterId: number }) {
  const t = useTranslations("masters.detail");
  const currentUser = useAuthStore((s) => s.user);
  const isClient = currentUser?.role === "client";

  const { data: elig } = useReviewEligibility(masterId, !!isClient);
  const createReview = useCreateReview(masterId);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");

  if (!isClient || !elig?.can_review) return null;

  const orderId = elig.orders[0]?.order_id;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error(t("reviewPickRating"));
      return;
    }
    if (!orderId) return;
    createReview.mutate(
      { order: orderId, rating, text: text.trim() },
      {
        onSuccess: () => {
          toast.success(t("reviewThanks"));
          setRating(0);
          setText("");
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <form onSubmit={submit} className="mb-6 rounded-xl border bg-card p-5 space-y-3">
      <div className="font-medium">{t("reviewWriteTitle")}</div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
            aria-label={`${n}`}
          >
            <Star
              className={
                "h-7 w-7 transition-colors " +
                ((hover || rating) >= n
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40")
              }
            />
          </button>
        ))}
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("reviewPlaceholder")}
        rows={3}
        maxLength={1000}
      />

      <Button type="submit" disabled={createReview.isPending || !rating}>
        {createReview.isPending ? t("reviewSubmitting") : t("reviewSubmit")}
      </Button>
    </form>
  );
}
