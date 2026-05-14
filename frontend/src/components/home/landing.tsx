import Link from "next/link";
import { ArrowRight, Sparkles, MessageCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export function Landing() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <Container className="py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI yordamida eng mos ustani toping
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Kerakli ustani <span className="text-primary">bir daqiqada</span> toping
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              Santexnik, elektrik, quruvchi, mebelchi va boshqa ustalar. Ishni tasvirlang —
              AI sizga eng mosini tanlab beradi. Chat orqali yoki to&apos;g&apos;ridan-to&apos;g&apos;ri
              qo&apos;ng&apos;iroq qiling.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/orders/new" />}>
                Buyurtma berish <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/register?role=master" />}
              >
                Usta sifatida qo&apos;shilish
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-16 md:py-24">
          <div className="grid md:grid-cols-3 gap-8">
            <Feature
              icon={<Sparkles className="h-6 w-6" />}
              title="AI matching"
              text="Buyurtmangizni tasvirlang — tizim toifani aniqlab, eng mos ustalar ro'yxatini chiqaradi."
            />
            <Feature
              icon={<MessageCircle className="h-6 w-6" />}
              title="Chat va qo'ng'iroq"
              text="Sayt ichida xabarlashish ham, telefon orqali bog'lanish ham — ikkalasi ham mavjud."
            />
            <Feature
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Ishonchli ustalar"
              text="Tasdiqlangan profillar, mijoz sharhlari va portfolio — har bir usta haqida to'liq ma'lumot."
            />
          </div>
        </Container>
      </section>
    </>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="inline-flex items-center justify-center h-11 w-11 rounded-lg bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
