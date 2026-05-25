import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { ChatRoomView } from "@/components/chat/chat-room-view";
import { Container } from "@/components/layout/container";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { roomId } = await params;
  return { title: `Chat #${roomId} · usta-call` };
}

export default async function ChatRoomPage({ params }: PageProps) {
  const { roomId } = await params;
  const id = Number(roomId);
  if (!Number.isFinite(id)) notFound();

  return (
    <Container className="py-6">
      <AuthGuard>
        <div className="max-w-3xl mx-auto">
          <ChatRoomView roomId={id} />
        </div>
      </AuthGuard>
    </Container>
  );
}
