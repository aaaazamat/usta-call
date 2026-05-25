import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Container } from "@/components/layout/container";
import { OrderDetailView } from "@/components/orders/order-detail-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Buyurtma #${id} · usta-call` };
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();

  return (
    <Container className="py-10">
      <AuthGuard>
        <div className="max-w-4xl mx-auto">
          <OrderDetailView orderId={orderId} />
        </div>
      </AuthGuard>
    </Container>
  );
}
