import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Container } from "@/components/layout/container";
import { MyOrdersList } from "@/components/orders/my-orders-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Buyurtmalarim · usta-call",
};

export default function MyOrdersPage() {
  return (
    <Container className="py-10">
      <AuthGuard>
        <Suspense fallback={<MyOrdersFallback />}>
          <MyOrdersList />
        </Suspense>
      </AuthGuard>
    </Container>
  );
}

function MyOrdersFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
