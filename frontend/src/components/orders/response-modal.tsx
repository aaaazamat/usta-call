"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("orders.responseModal");
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
      toast.error(t("priceRequired"));
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
          toast.success(existing ? t("updated") : t("sent"));
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
            {existing ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">
              {t("priceLabel")} <span className="text-destructive">*</span>
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
            <Label htmlFor="eta">{t("etaLabel")}</Label>
            <Input
              id="eta"
              type="number"
              inputMode="numeric"
              min={1}
              max={1000}
              value={etaHours}
              onChange={(e) => setEtaHours(e.target.value)}
              placeholder={t("etaPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("messageLabel")}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={sendMutation.isPending}>
            {sendMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("sending")}
              </>
            ) : existing ? (
              t("update")
            ) : (
              t("send")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
