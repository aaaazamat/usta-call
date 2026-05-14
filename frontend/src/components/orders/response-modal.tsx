"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useMyOrderResponse,
  useSendOrderResponse,
} from "@/lib/api/orders-hooks";
import { getApiErrorMessage } from "@/lib/api/errors";

interface Props {
  orderId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResponseModal({ orderId, open, onOpenChange }: Props) {
  const { data: existing } = useMyOrderResponse(orderId, open);
  const sendMutation = useSendOrderResponse(orderId);

  const [priceOffer, setPriceOffer] = useState("");
  const [message, setMessage] = useState("");
  const [etaHours, setEtaHours] = useState("");

  useEffect(() => {
    if (open && existing) {
      setPriceOffer(existing.price_offer);
      setMessage(existing.message);
      setEtaHours(existing.eta_hours != null ? String(existing.eta_hours) : "");
    } else if (open && !existing) {
      setPriceOffer("");
      setMessage("");
      setEtaHours("");
    }
  }, [open, existing]);

  const handleSubmit = () => {
    if (!priceOffer || Number(priceOffer) <= 0) {
      toast.error("Narxni kiriting");
      return;
    }
    sendMutation.mutate(
      {
        price_offer: priceOffer,
        message: message.trim() || undefined,
        eta_hours: etaHours ? Number(etaHours) : null,
      },
      {
        onSuccess: () => {
          toast.success(existing ? "Taklif yangilandi" : "Taklif yuborildi");
          onOpenChange(false);
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existing ? "Taklifni tahrirlash" : "Taklif yuborish"}
          </DialogTitle>
          <DialogDescription>
            Mijozga narx, xabar va bajarish muddatini taklif qiling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">
              Narx (so&apos;m) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              inputMode="numeric"
              min={0}
              value={priceOffer}
              onChange={(e) => setPriceOffer(e.target.value)}
              placeholder="300000"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eta">Bajarish muddati (soatlarda)</Label>
            <Input
              id="eta"
              type="number"
              inputMode="numeric"
              min={1}
              max={1000}
              value={etaHours}
              onChange={(e) => setEtaHours(e.target.value)}
              placeholder="Masalan: 4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Xabar (ixtiyoriy)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mijozga qo'shimcha izoh yoki savol..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={sendMutation.isPending}>
            {sendMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Yuborilmoqda...
              </>
            ) : existing ? (
              "Yangilash"
            ) : (
              "Yuborish"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
