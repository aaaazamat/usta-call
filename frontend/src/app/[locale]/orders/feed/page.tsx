import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Container } from "@/components/layout/container";
import { MasterFeedPage } from "@/components/dashboard/master-feed-page";

export const metadata: Metadata = {
  title: "Mos buyurtmalar · usta-call",
};

export default function OrdersFeedPage() {
  return (
    <Container className="py-10">
      <AuthGuard>
        <MasterFeedPage />
      </AuthGuard>
    </Container>
  );
}
