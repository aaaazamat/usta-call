import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { BookingsPage } from "@/components/bookings/bookings-page";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "So'rovlarim · usta-call",
};

export default function BookingsRoute() {
  return (
    <Container className="py-10">
      <AuthGuard>
        <BookingsPage />
      </AuthGuard>
    </Container>
  );
}
