"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategories, useRegions } from "@/lib/api/masters-hooks";
import { useCreateOrder } from "@/lib/api/orders-hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Urgency } from "@/lib/api/types";

const URGENCY_OPTIONS: { value: Urgency; label: string; desc: string }[] = [
  { value: "low", label: "Shoshilinch emas", desc: "Bir necha kun ichida" },
  { value: "normal", label: "Oddiy", desc: "1-2 kun ichida" },
  { value: "high", label: "Tezkor", desc: "Bugun" },
  { value: "emergency", label: "Favqulodda", desc: "Hozir, darhol" },
];

const MAX_IMAGES = 5;

export function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const createOrder = useCreateOrder();
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [budgetFrom, setBudgetFrom] = useState("");
  const [budgetTo, setBudgetTo] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const viloyatlar = regions?.filter((r) => r.kind === "viloyat") ?? [];
  const topCategories = categories?.filter((c) => !c.parent) ?? [];

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${MAX_IMAGES} ta rasm yuklash mumkin`);
      return;
    }
    const validNew = Array.from(files)
      .slice(0, remaining)
      .filter((f) => {
        if (!f.type.startsWith("image/")) {
          toast.error(`${f.name} — faqat rasm bo'lishi kerak`);
          return false;
        }
        if (f.size > 8 * 1024 * 1024) {
          toast.error(`${f.name} — 8MB dan oshmasligi kerak`);
          return false;
        }
        return true;
      });
    setImages((cur) => [...cur, ...validNew]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 5) {
      toast.error("Sarlavhani to'liqroq yozing (kamida 5 belgi)");
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      toast.error("Tavsifni batafsilroq yozing (kamida 15 belgi)");
      return;
    }
    if (!address.trim()) {
      toast.error("Manzilni kiriting");
      return;
    }

    createOrder.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        address: address.trim(),
        region: region ? Number(region) : null,
        category: category ? Number(category) : null,
        urgency,
        budget_from: budgetFrom || null,
        budget_to: budgetTo || null,
        uploaded_images: images,
      },
      {
        onSuccess: (order) => {
          toast.success("Buyurtma yaratildi! Mos ustalar tanlanmoqda...");
          router.push(`/orders/${order.id}`);
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section title="Asosiy ma'lumot">
        <div className="space-y-2">
          <Label htmlFor="title">
            Sarlavha <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: Vanna xonasiga jo'mrak o'rnatish"
            maxLength={180}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Batafsil tavsif <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ish nima ekanligini batafsil yozing — ustaga aniqroq tushunishga yordam beradi"
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            Tavsif qancha aniq bo&apos;lsa, AI shuncha mos ustani topadi
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kategoriya</Label>
            <Select
              value={category ?? ""}
              onValueChange={(v) => setCategory(v || null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kategoriyani tanlang (ixtiyoriy)">
                  {(value) =>
                    topCategories.find((c) => String(c.id) === value)?.name ??
                    "Kategoriyani tanlang"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {topCategories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Hudud</Label>
            <Select value={region ?? ""} onValueChange={(v) => setRegion(v || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Hududni tanlang">
                  {(value) =>
                    viloyatlar.find((r) => String(r.id) === value)?.name ??
                    "Hududni tanlang"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {viloyatlar.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">
            Manzil <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Masalan: Toshkent, Yunusobod tumani, Bog'ishamol 7"
            maxLength={250}
          />
        </div>
      </Section>

      <Section title="Shoshilinchlik darajasi">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {URGENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setUrgency(opt.value)}
              className={
                "rounded-lg border p-3 text-left transition " +
                (urgency === opt.value
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "hover:border-foreground/30")
              }
            >
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Byudjet" optional>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget_from">Dan (so&apos;m)</Label>
            <Input
              id="budget_from"
              type="number"
              inputMode="numeric"
              min={0}
              value={budgetFrom}
              onChange={(e) => setBudgetFrom(e.target.value)}
              placeholder="100000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_to">Gacha (so&apos;m)</Label>
            <Input
              id="budget_to"
              type="number"
              inputMode="numeric"
              min={0}
              value={budgetTo}
              onChange={(e) => setBudgetTo(e.target.value)}
              placeholder="500000"
            />
          </div>
        </div>
      </Section>

      <Section title="Rasmlar" optional>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addImages(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {images.map((file, idx) => (
            <ImagePreview
              key={idx}
              file={file}
              onRemove={() => setImages((cur) => cur.filter((_, i) => i !== idx))}
            />
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed hover:border-foreground/50 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition"
            >
              <ImagePlus className="h-6 w-6 mb-1" />
              <span className="text-xs">Rasm qo&apos;shish</span>
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Maksimal {MAX_IMAGES} ta rasm, har biri 8MB gacha
        </p>
      </Section>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          size="lg"
          disabled={createOrder.isPending}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          {createOrder.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Yaratilmoqda...
            </>
          ) : (
            "Buyurtmani e'lon qilish"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={createOrder.isPending}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Bekor qilish
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  optional,
  children,
}: {
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {optional && <span className="text-xs text-muted-foreground">ixtiyoriy</span>}
      </div>
      {children}
    </section>
  );
}

function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = URL.createObjectURL(file);
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Yuklangan rasm" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/70 text-white inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        aria-label="Olib tashlash"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
