import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { MastersList } from "@/components/masters/masters-list";
import { MasterCardSkeleton } from "@/components/masters/master-card";

export const metadata: Metadata = {
  title: "Ustalar · usta-call",
  description: "Santexnik, elektrik, quruvchi va boshqa ustalarni qidiring",
};

export default function MastersPage() {
  return (
    <Container className="py-10">
      <Suspense fallback={<MastersListFallback />}>
        <MastersList />
      </Suspense>
    </Container>
  );
}

function MastersListFallback() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-40 bg-muted rounded animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MasterCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
