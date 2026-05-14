"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { PortfolioItem } from "@/lib/api/types";

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [lightbox, setLightbox] = useState<{ item: PortfolioItem; index: number } | null>(
    null,
  );

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        Hali portfolio elementlari qo&apos;shilmagan
      </div>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-6">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border overflow-hidden bg-card">
            {item.images.length > 0 && (
              <div className="grid grid-cols-3 gap-0.5 aspect-[3/2] bg-muted">
                {item.images.slice(0, 3).map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setLightbox({ item, index: idx })}
                    className="relative overflow-hidden bg-muted hover:opacity-90 transition"
                  >
                    <Image
                      src={img.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      unoptimized
                    />
                    {idx === 2 && item.images.length > 3 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                        +{item.images.length - 3}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="p-4">
              <h3 className="font-medium">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
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
        aria-label="Yopish"
      >
        <X className="h-5 w-5" />
      </button>
      {total > 1 && (
        <>
          <button
            onClick={() => onIndexChange((index - 1 + total) % total)}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white inline-flex items-center justify-center hover:bg-black/80"
            aria-label="Oldingi"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => onIndexChange((index + 1) % total)}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white inline-flex items-center justify-center hover:bg-black/80"
            aria-label="Keyingi"
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
