import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { ChatRoomsList } from "@/components/chat/chat-rooms-list";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Chat · usta-call",
};

export default function ChatListPage() {
  return (
    <Container className="py-10">
      <AuthGuard>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Suhbatlar</h1>
            <p className="text-muted-foreground mt-1">
              Buyurtmalaringiz bo&apos;yicha ustalar bilan yozishmalar
            </p>
          </div>
          <ChatRoomsList />
        </div>
      </AuthGuard>
    </Container>
  );
}
