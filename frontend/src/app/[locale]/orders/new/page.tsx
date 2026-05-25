import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Container } from "@/components/layout/container";
import { OrderForm } from "@/components/orders/order-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Buyurtma berish · usta-call",
};

export default function NewOrderPage() {
  return (
    <Container className="py-10">
      <AuthGuard>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Yangi buyurtma</h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Ishingiz haqida yozing — AI siz uchun eng mos ustalarni topadi
            </p>
          </div>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <OrderForm />
          </Suspense>
        </div>
      </AuthGuard>
    </Container>
  );
}
