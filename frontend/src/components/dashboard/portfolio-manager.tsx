"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useCategories } from "@/lib/api/masters-hooks";
import {
  useCreatePortfolioItem,
  useDeletePortfolioItem,
  useMasterPortfolio,
} from "@/lib/api/master-me-hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { PortfolioItem } from "@/lib/api/types";

const MAX_IMAGES = 8;

export function PortfolioManager() {
  const { data: items, isLoading } = useMasterPortfolio();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Portfolio mijozlar uchun sizning ishingizning sifatini ko&apos;rsatadi
        </p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Yangi qo&apos;shish
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      ) : !items || items.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-12 text-center">
          <p className="text-base font-medium">Portfolio bo&apos;sh</p>
          <p className="text-sm text-muted-foreground mt-1">
            Birinchi ishingizni qo&apos;shing
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <PortfolioCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <AddPortfolioDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const deleteMutation = useDeletePortfolioItem();

  const handleDelete = () => {
    if (!confirm(`"${item.title}" — o'chirilsinmi?`)) return;
    deleteMutation.mutate(item.id, {
      onSuccess: () => toast.success("O'chirildi"),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  return (
    <Card className="overflow-hidden p-0">
      {item.images.length > 0 && (
        <div className="relative aspect-[4/3] bg-muted">
          <Image
            src={item.images[0].image}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
          {item.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              +{item.images.length - 1}
            </div>
          )}
        </div>
      )}
      <div className="p-4 space-y-2">
        <h3 className="font-medium line-clamp-1">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="text-destructive w-full"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> O&apos;chirish
        </Button>
      </div>
    </Card>
  );
}

function AddPortfolioDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: categories } = useCategories();
  const createMutation = useCreatePortfolioItem();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);

  const topCategories = categories?.filter((c) => !c.parent) ?? [];

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory(null);
    setImages([]);
  };

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${MAX_IMAGES} ta rasm`);
      return;
    }
    const valid = Array.from(files)
      .slice(0, remaining)
      .filter((f) => {
        if (!f.type.startsWith("image/")) return false;
        if (f.size > 8 * 1024 * 1024) {
          toast.error(`${f.name} — 8MB dan oshmasligi kerak`);
          return false;
        }
        return true;
      });
    setImages((cur) => [...cur, ...valid]);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Sarlavhani kiriting");
      return;
    }
    if (images.length === 0) {
      toast.error("Kamida bitta rasm yuklang");
      return;
    }
    createMutation.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        category: category ? Number(category) : null,
        uploaded_images: images,
      },
      {
        onSuccess: () => {
          toast.success("Portfolio elementi qo'shildi");
          reset();
          onOpenChange(false);
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Portfolio elementi qo&apos;shish</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p_title">Sarlavha</Label>
            <Input
              id="p_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: Hammomda santexnika ishlari"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="p_desc">Tavsif</Label>
            <Textarea
              id="p_desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qanday ish bajarildi, qancha vaqt oldi..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Kategoriya</Label>
            <Select value={category ?? ""} onValueChange={(v) => setCategory(v || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tanlash (ixtiyoriy)">
                  {(v) =>
                    topCategories.find((c) => String(c.id) === v)?.name ?? "Tanlash"
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
            <Label>Rasmlar</Label>
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
            <div className="grid grid-cols-4 gap-2">
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
                  className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs mt-1">Qo&apos;shish</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saqlanmoqda...
              </>
            ) : (
              "Saqlash"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = URL.createObjectURL(file);
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Yuklangan" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
