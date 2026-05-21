"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  HandshakeIcon,
  MessageCircle,
  Phone,
  Search,
  Send,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
} as const;

const stagger = {
  initial: {},
  whileInView: {},
  viewport: { once: true, margin: "-100px" },
  transition: { staggerChildren: 0.1 },
} as const;

export function HowItWorksView() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <ClientFlowSection />
      <ContactSection />
      <MasterFlowSection />
      <FaqSection />
      <CtaSection />
    </div>
  );
}

/* ─────────── Hero ─────────── */
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-mesh py-24 md:py-32">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 -left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute -top-20 right-20 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <Container className="relative">
        <motion.div
          style={{ y, opacity }}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border bg-white/80 backdrop-blur px-4 py-1.5 text-sm text-muted-foreground mb-6 shadow-sm"
          >
            <Zap className="h-4 w-4 text-primary" />
            Soda va tushunarli
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            usta-call qanday <br />
            <span className="gradient-text">ishlaydi?</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground"
          >
            Mijoz uchun — bir daqiqada eng mos ustani toping. Usta uchun — yangi
            mijozlar va doimiy daromad. Quyida har bir bosqich.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}

/* ─────────── Mijoz uchun oqim ─────────── */
function ClientFlowSection() {
  const steps = [
    {
      icon: ClipboardList,
      title: "Buyurtma yarating",
      text: "Sarlavha, batafsil tavsif, manzil. Kerak bo'lsa rasm yuklang. Bir necha daqiqa.",
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
    },
    {
      icon: Sparkles,
      title: "AI sizga ustalarni topadi",
      text: "Sun'iy intellekt buyurtmangizni tahlil qilib, eng mos ustalar ro'yxatini chiqaradi.",
      color: "from-purple-500 to-pink-500",
      bg: "bg-purple-50",
    },
    {
      icon: HandshakeIcon,
      title: "Ustani band qiling",
      text: "Tavsiyadan ustani tanlang. 'Band qilish' bosing — usta sizga qo'ng'iroq qiladi.",
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
    },
    {
      icon: Star,
      title: "Bahosini bering",
      text: "Ish bajarilgach, ustaga sharh qoldiring va boshqalarga yo'l ko'rsating.",
      color: "from-emerald-500 to-green-500",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <Container>
        <motion.div {...fadeInUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-3 font-medium">
            <Users className="h-4 w-4" />
            Mijozlar uchun
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            4 ta oddiy <span className="gradient-text">qadam</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Vaqtingizni tejaymiz — bir necha daqiqa ichida eng yaxshi taklifni olasiz
          </p>
        </motion.div>

        {/* Steps timeline */}
        <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, idx) => (
            <motion.div
              key={s.title}
              variants={fadeInUp}
              className="relative"
            >
              {/* Connection line */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-2.5 w-5 h-0.5 bg-gradient-to-r from-border to-transparent" />
              )}

              <div className="card-lift rounded-2xl border bg-card p-6 h-full relative overflow-hidden group">
                {/* Hover gradient backdrop */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-lg`}
                    >
                      <s.icon className="h-7 w-7" />
                    </div>
                    <div className="text-5xl font-bold text-muted/30 leading-none">
                      0{idx + 1}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div {...fadeInUp} className="mt-12 text-center">
          <Button size="lg" render={<Link href="/orders/new" />}>
            Buyurtma berishni boshlash
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}

/* ─────────── Aloqa bo'limi ─────────── */
function ContactSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-y">
      <Container>
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <motion.div {...fadeInUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-background border px-3 py-1 text-sm mb-4 shadow-sm">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Aloqa qulayligi</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ikki xil <span className="gradient-text">bog&apos;lanish</span> usuli
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Ustani band qilganingizdan keyin u sizga to&apos;g&apos;ridan-to&apos;g&apos;ri
              qo&apos;ng&apos;iroq qiladi. Yoki saytdagi telefon raqami orqali siz qo&apos;ng&apos;iroq
              qila olasiz.
            </p>

            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 rounded-xl bg-background border p-4"
              >
                <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white inline-flex items-center justify-center shadow-sm">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Telefon qo&apos;ng&apos;iroq</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Bevosita ustaning raqamiga qo&apos;ng&apos;iroq qiling
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3 rounded-xl bg-background border p-4"
              >
                <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white inline-flex items-center justify-center shadow-sm">
                  <HandshakeIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Band qilish so&apos;rovi</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Usta sizga o&apos;zi qo&apos;ng&apos;iroq qiladi va kelishadi
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="rounded-3xl border bg-background p-8 shadow-xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-2xl" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-500 text-white inline-flex items-center justify-center shadow-lg">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">AI matching</p>
                    <p className="text-xs text-muted-foreground">Aqlli moslashtirish</p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {[
                    "Buyurtma matnidan kasbni avtomatik aniqlaydi",
                    "Reyting va tajribani inobatga oladi",
                    "Hududingizdagi ustalarni topadi",
                    "Mos kelish darajasini foiz bilan ko'rsatadi",
                  ].map((item, idx) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + idx * 0.08 }}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

/* ─────────── Usta uchun oqim ─────────── */
function MasterFlowSection() {
  const steps = [
    {
      icon: UserPlus,
      title: "Ro'yxatdan o'ting",
      text: "Telefon raqamingiz bilan ro'yxatdan o'ting va o'zingizni usta sifatida belgilang.",
    },
    {
      icon: Wrench,
      title: "Profilingizni to'ldiring",
      text: "Bio yozing, kasblaringizni tanlang (bitta yoki bir nechta), narx va hududlarni belgilang.",
    },
    {
      icon: ClipboardList,
      title: "Portfolio yuklang",
      text: "Avval bajargan ishlaringizning rasmlarini joylashtiring — mijozlar ishonchli usta tanlaydi.",
    },
    {
      icon: Search,
      title: "Buyurtmalarni ko'ring",
      text: "Kasbingiz va hududingizga mos buyurtmalar avtomatik chiqadi.",
    },
    {
      icon: Send,
      title: "So'rovlarni qabul qiling",
      text: "Mijozlar sizni band qiladi — telefon orqali bog'lanib, kelishasiz va ishni bajarasiz.",
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <Container>
        <motion.div {...fadeInUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-3 font-medium">
            <Wrench className="h-4 w-4" />
            Ustalar uchun
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            5 ta qadamda <span className="gradient-text">ish topish</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Yangi mijozlar va doimiy daromad — hech qanday to&apos;lov yo&apos;q
          </p>
        </motion.div>

        <motion.div {...stagger} className="max-w-3xl mx-auto space-y-4">
          {steps.map((s, idx) => (
            <motion.div
              key={s.title}
              variants={fadeInUp}
              className="relative pl-8 md:pl-16"
            >
              {/* Vertikal chiziq */}
              {idx < steps.length - 1 && (
                <div className="absolute left-3 md:left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 to-transparent" />
              )}

              <div className="card-lift flex items-start gap-4 rounded-2xl border bg-card p-5">
                {/* Step number circle */}
                <div className="absolute left-0 md:left-0 top-5 inline-flex items-center justify-center w-7 h-7 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 text-white text-sm md:text-base font-bold shadow-lg">
                  {idx + 1}
                </div>

                <div className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div {...fadeInUp} className="mt-12 text-center">
          <Button size="lg" render={<Link href="/register?role=master" />}>
            Usta sifatida ro&apos;yxatdan o&apos;tish
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}

/* ─────────── FAQ ─────────── */
function FaqSection() {
  const faqs = [
    {
      q: "Xizmat to'lovli mi?",
      a: "Hozircha sayt to'liq bepul — mijoz ham, usta ham hech qanday to'lov to'lamaydi. Faqat ish bahosi mijoz va usta o'rtasida kelishilgan miqdorda bo'ladi.",
    },
    {
      q: "Usta qancha kasbga ega bo'lishi mumkin?",
      a: "Cheklov yo'q. Profilingizda bir nechta kasb (kategoriya) tanlasangiz, har biriga oid buyurtmalar sizga ko'rinadi.",
    },
    {
      q: "AI qanday qilib mos ustani topadi?",
      a: "Buyurtmangiz matnini tahlil qilib, kerakli kasb va aniq ko'nikmalarni aniqlaydi. So'ng tasdiqlangan ustalardan kasbi, hududi va reytingi mos keladiganlarni reyt qiladi.",
    },
    {
      q: "Pulni qanday topshiraman?",
      a: "To'lov mijoz va usta o'rtasida to'g'ridan-to'g'ri amalga oshiriladi — naqd, bank kartasi yoki o'zaro kelishuvga binoan. Saytda to'lov tizimi yo'q.",
    },
    {
      q: "Sharhlar haqiqiymi?",
      a: "Sharhni faqat yakunlangan buyurtma egasi yoza oladi. Har bir buyurtma uchun bittadan sharh — sun'iy reyting qo'yish mumkin emas.",
    },
    {
      q: "Usta yomon ishlasa nima qilish kerak?",
      a: "Past baho qo'ying va sharh yozing — bu boshqa mijozlarga yordam beradi. Yomon ishlagan ustani admin moderatsiyaga jo'natamiz.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30 border-y">
      <Container>
        <motion.div {...fadeInUp} className="text-center mb-12 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tez-tez beriladigan <span className="gradient-text">savollar</span>
          </h2>
          <p className="text-muted-foreground">
            Eng ko&apos;p so&apos;raladigan savollarga aniq javoblar
          </p>
        </motion.div>

        <motion.div {...stagger} className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-2xl border bg-card overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 hover:bg-muted/40 transition-colors text-left"
      >
        <span className="font-semibold">{q}</span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border text-muted-foreground"
        >
          <span className="text-lg leading-none">+</span>
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────── CTA ─────────── */
function CtaSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/20 to-pink-500/20 rounded-full blur-3xl" />

      <Container className="relative">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-4 py-1.5 text-sm mb-6">
            <Zap className="h-4 w-4 text-primary" />
            Hozir boshlang
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Boshlashga</span> tayyormisiz?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Hozir boshlasangiz, bir necha daqiqada eng mos ustalarni topasiz. Hech
            qanday to&apos;lov yoki obuna kerakmas.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" render={<Link href="/orders/new" />}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Buyurtma berish
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/register?role=master" />}
            >
              Usta sifatida qo&apos;shilish
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
