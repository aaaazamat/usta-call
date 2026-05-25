import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { MasterDetailView } from "@/components/masters/master-detail-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Usta #${id} · usta-call`,
  };
}

export default async function MasterDetailPage({ params }: PageProps) {
  const { id } = await params;
  const masterId = Number(id);
  if (!Number.isFinite(masterId)) notFound();

  return (
    <Container className="py-10">
      <MasterDetailView masterId={masterId} />
    </Container>
  );
}
