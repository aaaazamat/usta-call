"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBooking } from "@/lib/api/bookings-hooks";
import { useMyOrders } from "@/lib/api/orders-hooks";
import { getApiErrorMessage } from "@/lib/api/errors";

interface Props {
  /** Bu ustaning ID'si */
  masterId: number;
  masterName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Agar foydalanuvchi /orders/<id> sahifasidan ochsa, shu order avtomatik tanlanadi */
  preselectedOrderId?: number;
}

/**
 * Mijoz ustani "band qilish" so'rovini yuborish dialog'i.
 * Mavjud buyurtmalardan birini tanlaydi yoki yangi yaratadi.
 */
export function BookMasterDialog({
  masterId,
  masterName,
  open,
  onOpenChange,
  preselectedOrderId,
}: Props) {
  const router = useRouter();
  const { data: ordersData, isLoading: ordersLoading } = useMyOrders();
  const createBooking = useCreateBooking();

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    preselectedOrderId ?? null,
  );
  const [note, setNote] = useState("");

  // Modal qaytadan ochilganda preselectedOrderId'ni qo'llab-quvvatlash
  useEffect(() => {
    if (open && preselectedOrderId !== undefined) {
      setSelectedOrderId(preselectedOrderId);
    }
  }, [open, preselectedOrderId]);

  // Faqat aktiv buyurtmalarni ko'rsatamiz
  const activeOrders =
    ordersData?.results.filter(
      (o) => o.status === "published" || o.status === "matched",
    ) ?? [];

  const handleSubmit = () => {
    if (!selectedOrderId) {
      toast.error("Buyurtmani tanlang");
      return;
    }
    createBooking.mutate(
      { order: selectedOrderId, master: masterId, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`${masterName} ustasi band qilish so'rovi yuborildi`);
          setSelectedOrderId(null);
          setNote("");
          onOpenChange(false);
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ustani band qilish</DialogTitle>
          <DialogDescription>
            Qaysi buyurtma uchun ustani band qilmoqchisiz? Usta sizning telefoningizga
            qo&apos;ng&apos;iroq qiladi va kelishadi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">
              Buyurtmani tanlang
            </div>
            {ordersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="rounded-lg border bg-muted/30 p-5 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Sizda hali aktiv buyurtmalar yo&apos;q
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    router.push("/orders/new");
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Yangi buyurtma yaratish
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activeOrders.map((o) => {
                  const selected = selectedOrderId === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelectedOrderId(o.id)}
                      className={
                        "w-full text-left rounded-lg border p-3 transition " +
                        (selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "hover:border-foreground/30")
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm line-clamp-1">
                          {o.title}
                        </div>
                        {selected && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {o.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
            {activeOrders.length > 0 && (
              <Link
                href="/orders/new"
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                + Yangi buyurtma yaratish
              </Link>
            )}
          </div>

          {selectedOrderId && (
            <div>
              <div className="text-sm font-medium mb-2">
                Qisqa eslatma (ixtiyoriy)
              </div>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ustaga qo'shimcha aytmoqchi bo'lgan narsangiz..."
                rows={3}
                maxLength={500}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedOrderId || createBooking.isPending}
          >
            {createBooking.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Yuborilmoqda...
              </>
            ) : (
              "Band qilish so'rovini yuborish"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
