import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Container } from "@/components/layout/container";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Usta paneli · usta-call",
};

export default function DashboardPage() {
  return (
    <Container className="py-10">
      <AuthGuard>
        <DashboardView />
      </AuthGuard>
    </Container>
  );
}
