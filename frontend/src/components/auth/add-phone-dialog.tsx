"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useAuthStore } from "@/lib/auth/store";
import { formatUzPhoneInput, isValidUzPhone, toE164 } from "@/lib/phone";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Telefon muvaffaqiyatli qo'shilgach yo'naltiriladigan manzil */
  redirectTo?: string;
}

/** Google bilan kirgan foydalanuvchidan telefon raqamini so'raydi.
 *
 * Telefon bizning marketplace uchun majburiy (ustalar bilan bog'lanish uchun).
 * Modal yopib bo'lmaydi — kirib chiqquncha qoldiriladi.
 */
export function AddPhoneDialog({ open, onOpenChange, redirectTo = "/" }: Props) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [phone, setPhone] = useState("+998 ");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUzPhone(phone)) {
      toast.error("Telefon raqamini to'liq kiriting");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await authApi.addPhone(toE164(phone));
      setUser(updated);
      toast.success("Telefon saqlandi");
      onOpenChange(false);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Phone className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center">
            Telefon raqamingizni qo&apos;shing
          </DialogTitle>
          <DialogDescription className="text-center">
            Ustalar siz bilan bog&apos;lanishi uchun telefon raqami majburiy.
            <br />
            Faqat bir marta kiritasiz.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add_phone">Telefon raqami</Label>
            <Input
              id="add_phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatUzPhoneInput(e.target.value))}
              placeholder="+998 90 123 45 67"
              className="h-12 text-base"
              autoFocus
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              Faqat siz va kelishilgan ustalar ko&apos;radi
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={submitting || !isValidUzPhone(phone)}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saqlanmoqda...
              </>
            ) : (
              "Saqlash va davom etish"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
