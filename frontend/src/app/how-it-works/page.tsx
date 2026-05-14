import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Handshake,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Qanday ishlaydi · usta-call",
  description:
    "usta-call qanday ishlaydi: mijozlar va ustalar uchun bosqichma-bosqich qo'llanma",
};

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <Container className="py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Soda va tezkor
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            usta-call qanday ishlaydi?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mijoz uchun — bir daqiqada eng mos ustani toping. Usta uchun — yangi
            mijozlar va doimiy daromad. Quyida har bir bosqich tushuntirilgan.
          </p>
        </Container>
      </section>

      {/* Mijoz uchun */}
      <section>
        <Container className="py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-3">
              <Users className="h-4 w-4" />
              Mijozlar uchun
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              4 ta oddiy qadamda ustani toping
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Vaqtingizni tejaymiz — bir necha daqiqa ichida buyurtma bering va eng yaxshi
              taklifni oling
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Step
              number="1"
              icon={<ClipboardList className="h-6 w-6" />}
              title="Buyurtma yarating"
              text="Sarlavha va batafsil tavsifni yozing. Manzilni kiriting. Kerak bo'lsa, rasm yuklang."
            />
            <Step
              number="2"
              icon={<Sparkles className="h-6 w-6" />}
              title="AI tahlil qiladi"
              text="Sun'iy intellekt buyurtmangizni o'qib, kerakli kasb va ko'nikmalarni aniqlaydi."
            />
            <Step
              number="3"
              icon={<Handshake className="h-6 w-6" />}
              title="Eng mos ustani tanlang"
              text="Sizga eng mos ustalar reyting va tajriba bilan ko'rsatiladi. Taklifni qabul qiling."
            />
            <Step
              number="4"
              icon={<Star className="h-6 w-6" />}
              title="Bahosini bering"
              text="Ish bajarilgandan so'ng ustaga sharh qoldiring — boshqalarga yordam bering."
            />
          </div>

          <div className="mt-10 flex justify-center">
            <Button size="lg" render={<Link href="/orders/new" />}>
              Buyurtma berishni boshlash <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Container>
      </section>

      {/* Aloqa */}
      <section className="bg-muted/30 border-y">
        <Container className="py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Ikki xil bog&apos;lanish usuli
              </h3>
              <p className="text-muted-foreground mb-6">
                Usta tanlanganidan so&apos;ng siz unga ikki yo&apos;l bilan murojaat qilishingiz
                mumkin — qaysi qulay bo&apos;lsa.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Sayt ichida chat</p>
                    <p className="text-sm text-muted-foreground">
                      Real vaqtda yozishing — rasm yuborish ham mumkin
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Telefon qo&apos;ng&apos;iroq</p>
                    <p className="text-sm text-muted-foreground">
                      Ustaning raqamiga to&apos;g&apos;ridan-to&apos;g&apos;ri qo&apos;ng&apos;iroq qiling
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">AI matching nima beradi?</p>
                  <p className="text-xs text-muted-foreground">Aniq va tezkor</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <CheckListItem text="Buyurtma matnidan kasbni avtomatik aniqlaydi" />
                <CheckListItem text="Reyting va tajribani inobatga oladi" />
                <CheckListItem text="Hududingizdagi ustalarni topadi" />
                <CheckListItem text="Mos darajasini foiz bilan ko'rsatadi" />
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Usta uchun */}
      <section>
        <Container className="py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-3">
              <Wrench className="h-4 w-4" />
              Ustalar uchun
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              5 ta qadamda ish topishni boshlang
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Yangi mijozlar va doimiy daromad — hech qanday to&apos;lov yo&apos;q,
              ro&apos;yxatdan o&apos;ting va ish boshlang
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <MasterStep
              number="1"
              icon={<UserPlus className="h-5 w-5" />}
              title="Ro'yxatdan o'ting"
              text="Telefon raqamingiz bilan ro'yxatdan o'ting va o'zingizni usta sifatida belgilang. SMS orqali tasdiqlash."
            />
            <MasterStep
              number="2"
              icon={<Wrench className="h-5 w-5" />}
              title="Profilingizni to'ldiring"
              text="O'zingiz haqingizda yozing, kasblaringizni tanlang (bitta yoki bir nechtasi), narx va xizmat ko'rsatadigan hududlarni belgilang."
            />
            <MasterStep
              number="3"
              icon={<ClipboardList className="h-5 w-5" />}
              title="Portfolio yuklang"
              text="Avval bajargan ishlaringizning rasmlarini joylashtiring — mijozlar ishonchli usta tanlashda yordam beradi."
            />
            <MasterStep
              number="4"
              icon={<Send className="h-5 w-5" />}
              title="Taklif yuboring"
              text="Sizga mos buyurtmalarni «Buyurtmalar» bo'limidan ko'ring. Narx va vaqtni taklif qilib, mijoz e'tiborini qozoning."
            />
            <MasterStep
              number="5"
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Ishni bajaring va daromad oling"
              text="Mijoz sizni tanlasa, chat orqali kelishib oling va ishni bajaring. Yaxshi sharhlar — keyingi buyurtmalar."
            />
          </div>

          <div className="mt-10 flex justify-center">
            <Button size="lg" render={<Link href="/register?role=master" />}>
              Usta sifatida ro&apos;yxatdan o&apos;tish <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 border-t">
        <Container className="py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Tez-tez beriladigan savollar
          </h2>
          <div className="max-w-3xl mx-auto space-y-3">
            <FaqItem
              q="Xizmat to'lovli mi?"
              a="Hozircha sayt to'liq bepul — mijoz ham, usta ham hech qanday to'lov to'lamaydi. Faqat ish bahosi mijoz va usta o'rtasida kelishilgan miqdorda bo'ladi."
            />
            <FaqItem
              q="Usta qancha kasbga ega bo'lishi mumkin?"
              a="Cheklov yo'q. Profilingizda bir nechta kasb (kategoriya) tanlasangiz, har biriga oid buyurtmalar sizga ko'rinadi."
            />
            <FaqItem
              q="AI qanday qilib mos ustani topadi?"
              a="Buyurtmangiz matnini tahlil qilib, kerakli kasb va aniq ko'nikmalarni aniqlaydi. So'ng tasdiqlangan ustalardan kasbi, hududi va reytingi mos keladiganlarni reyt qiladi."
            />
            <FaqItem
              q="Pulni qanday topshiraman?"
              a="To'lov mijoz va usta o'rtasida to'g'ridan-to'g'ri amalga oshiriladi — naqd, bank kartasi yoki o'zaro kelishuvga binoan. Saytda to'lov tizimi yo'q."
            />
            <FaqItem
              q="Sharhlar haqiqiymi?"
              a="Sharhni faqat yakunlangan buyurtma egasi yoza oladi. Har bir buyurtma uchun bittadan sharh — sun'iy reyting qo'yish mumkin emas."
            />
            <FaqItem
              q="Usta yomon ishlasa nima qilish kerak?"
              a="Past baho qo'ying va sharh yozing — bu boshqa mijozlarga yordam beradi. Yomon ishlagan ustani admin moderatsiyaga jo'natamiz."
            />
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t bg-gradient-to-b from-transparent to-primary/5">
        <Container className="py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Boshlashga tayyormisiz?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Mijoz bo&apos;lsangiz — buyurtma bering. Usta bo&apos;lsangiz — ro&apos;yxatdan
            o&apos;ting va birinchi ishlaringizni toping.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" render={<Link href="/orders/new" />}>
              Buyurtma berish
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/register?role=master" />}
            >
              Usta bo&apos;lib qo&apos;shilish
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

function Step({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="relative rounded-xl border bg-card p-6">
      <div className="absolute -top-3 left-6 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
        {number}
      </div>
      <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function MasterStep({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border bg-card p-5">
      <div className="shrink-0">
        <div className="relative">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {number}
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function CheckListItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
      <span>{text}</span>
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border bg-card overflow-hidden">
      <summary className="cursor-pointer flex items-center justify-between gap-4 p-5 list-none hover:bg-muted/50 transition">
        <span className="font-medium">{q}</span>
        <span className="text-muted-foreground text-xl group-open:rotate-45 transition-transform">
          +
        </span>
      </summary>
      <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
        {a}
      </div>
    </details>
  );
}
