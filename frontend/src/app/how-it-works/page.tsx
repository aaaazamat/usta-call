import type { Metadata } from "next";

import { HowItWorksView } from "@/components/home/how-it-works-view";

export const metadata: Metadata = {
  title: "Qanday ishlaydi · usta-call",
  description:
    "usta-call qanday ishlaydi: mijozlar va ustalar uchun bosqichma-bosqich qo'llanma",
};

export default function HowItWorksPage() {
  return <HowItWorksView />;
}
