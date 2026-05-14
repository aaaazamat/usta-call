import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { ProfileView } from "@/components/profile/profile-view";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Profil · usta-call",
};

export default function ProfilePage() {
  return (
    <Container className="py-10">
      <AuthGuard>
        <ProfileView />
      </AuthGuard>
    </Container>
  );
}
