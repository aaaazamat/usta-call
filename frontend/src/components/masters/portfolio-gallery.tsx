"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { PortfolioItem } from "@/lib/api/types";

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const t = useTranslations("masters.detail");
  const [lightbox, setLightbox] = useState<{ item: PortfolioItem; index: number } | null>(
    null,
  );

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        {t("portfolioEmpty")}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border overflow-hidden bg-card">
            {item.images.length > 0 && (
              // Barcha rasmlar ekran bo'ylab yoyiladi (responsive: mobil 2, planshet 3,
              // laptop 4, katta ekran 6 ustun). "+N" overlay yo'q — hammasi ko'rinadi.
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1.5 p-1.5">
                {item.images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setLightbox({ item, index: idx })}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted hover:opacity-95 transition"
                  >
                    <Image
                      src={img.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
            <div className="p-4 pt-2">
              <h3 className="font-medium">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={lightbox !== null} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0">
          {lightbox && (
            <Lightbox
              item={lightbox.item}
              index={lightbox.index}
              onIndexChange={(index) => setLightbox({ ...lightbox, index })}
              onClose={() => setLightbox(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Lightbox({
  item,
  index,
  onIndexChange,
  onClose,
}: {
  item: PortfolioItem;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const tc = useTranslations("common");
  const tm = useTranslations("masters");
  const total = item.images.length;
  const current = item.images[index];

  return (
    <div className="relative aspect-[4/3] sm:aspect-[16/10]">
      <Image
        src={current.image}
        alt={item.title}
        fill
        className="object-contain"
        sizes="100vw"
        unoptimized
      />
      <button
        onClick={onClose}
        className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/60 text-white inline-flex items-center justify-center hover:bg-black/80"
        aria-label={tc("close")}
      >
        <X className="h-5 w-5" />
      </button>
      {total > 1 && (
        <>
          <button
            onClick={() => onIndexChange((index - 1 + total) % total)}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white inline-flex items-center justify-center hover:bg-black/80"
            aria-label={tm("prev")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => onIndexChange((index + 1) % total)}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white inline-flex items-center justify-center hover:bg-black/80"
            aria-label={tm("next")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-2 py-1 rounded">
            {index + 1} / {total}
          </div>
        </>
      )}
    </div>
  );
}
