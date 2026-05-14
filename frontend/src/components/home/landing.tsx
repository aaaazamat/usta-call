"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  HandshakeIcon,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { useCategories, useMasters } from "@/lib/api/masters-hooks";
import { getCategoryIcon } from "@/lib/category-icons";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
} as const;

const stagger = {
  initial: {},
  whileInView: {},
  viewport: { once: true, margin: "-100px" },
  transition: { staggerChildren: 0.08 },
} as const;

export function Landing() {
  return (
    <>
      <Hero />
      <CategoriesSection />
      <StatsSection />
      <FeaturedMastersSection />
      <HowItWorksSection />
      <CtaSection />
    </>
  );
}

/* ─────────── Hero ─────────── */
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-mesh">
      {/* Animatsion bloblar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-20 -right-10 w-72 h-72 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-pink-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <Container className="relative py-24 md:py-32">
        <motion.div style={{ y, opacity }} className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border bg-white/80 backdrop-blur px-4 py-1.5 text-sm text-muted-foreground mb-6 shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            AI yordamida eng mos ustani toping
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Kerakli ustani <br />
            <span className="gradient-text">bir daqiqada</span> toping
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Santexnik, elektrik, quruvchi va boshqa minglab ustalar — barchasi bir
            joyda. Ishni tasvirlang, AI siz uchun eng mosini tanlab beradi.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Button size="lg" render={<Link href="/orders/new" />}>
              Buyurtma berish
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/masters" />}
            >
              Ustalarni ko&apos;rish
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex -space-x-2">
              {[11, 12, 13, 14, 15].map((id) => (
                <Avatar key={id} className="h-8 w-8 ring-2 ring-background">
                  <AvatarImage src={`https://i.pravatar.cc/64?img=${id}`} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-xs">500+ mamnun mijozlar</div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

/* ─────────── Categories ─────────── */
function CategoriesSection() {
  const { data: categories } = useCategories();
  const topCategories = categories?.filter((c) => !c.parent) ?? [];

  return (
    <section className="py-20 md:py-28 bg-background">
      <Container>
        <motion.div {...fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Qaysi <span className="gradient-text">kasb</span> kerak?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            11 ta yo&apos;nalishda yuzlab tasdiqlangan ustalar. Birini tanlang
            yoki AI sizga eng mosini topib beradi.
          </p>
        </motion.div>

        <motion.div
          {...stagger}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          {topCategories.map((cat) => {
            const info = getCategoryIcon(cat.slug);
            const Icon = info.icon;
            return (
              <motion.div key={cat.id} variants={fadeInUp}>
                <Link
                  href={`/masters?category=${cat.id}`}
                  className="card-lift block rounded-2xl border bg-card p-5 h-full group"
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${info.bg} ${info.color} mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="font-medium text-sm">{cat.name}</div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}

/* ─────────── Stats ─────────── */
function StatsSection() {
  const stats = [
    { value: "30+", label: "Tasdiqlangan ustalar", icon: Users },
    { value: "100%", label: "Tekin xizmat", icon: ShieldCheck },
    { value: "AI", label: "Aqlli moslashtirish", icon: Sparkles },
    { value: "24/7", label: "Doimo ochiq", icon: MessageCircle },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-y">
      <Container>
        <motion.div
          {...stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeInUp}
              className="text-center"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-background border shadow-sm mb-3">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                {s.value}
              </div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

/* ─────────── Featured masters ─────────── */
function FeaturedMastersSection() {
  const { data, isLoading } = useMasters({ ordering: "-rating_cache" });
  const masters = data?.results.slice(0, 6) ?? [];

  return (
    <section className="py-20 md:py-28">
      <Container>
        <motion.div {...fadeInUp} className="flex items-end justify-between gap-4 mb-10 flex-wrap">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3">
              <span className="gradient-text">Top</span> ustalar
            </h2>
            <p className="text-muted-foreground">
              Eng yuqori reytingdagi ishonchli ustalar
            </p>
          </div>
          <Link
            href="/masters"
            className="text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            Barchasini ko&apos;rish <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-muted shimmer" />
            ))}
          </div>
        ) : (
          <motion.div
            {...stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {masters.map((m) => {
              const rating = Number(m.rating_cache);
              const hasRating = m.reviews_count_cache > 0;
              return (
                <motion.div key={m.id} variants={fadeInUp}>
                  <Link
                    href={`/masters/${m.id}`}
                    className="card-lift block rounded-2xl border bg-card p-5 h-full"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={m.user.avatar ?? undefined} />
                        <AvatarFallback>
                          {m.user.full_name?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {m.user.full_name || "Usta"}
                        </div>
                        {hasRating ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-foreground font-medium">
                              {rating.toFixed(1)}
                            </span>
                            <span>· {m.completed_orders_cache} ish</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Yangi usta
                          </div>
                        )}
                      </div>
                    </div>
                    {m.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {m.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {m.categories.slice(0, 3).map((c) => {
                        const info = getCategoryIcon(c.slug);
                        const Icon = info.icon;
                        return (
                          <span
                            key={c.id}
                            className={`inline-flex items-center gap-1 ${info.bg} ${info.color} px-2 py-0.5 rounded-full text-xs font-medium`}
                          >
                            <Icon className="h-3 w-3" />
                            {c.name}
                          </span>
                        );
                      })}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </Container>
    </section>
  );
}

/* ─────────── How it works ─────────── */
function HowItWorksSection() {
  const steps = [
    {
      icon: ClipboardList,
      title: "Buyurtma yarating",
      text: "Nima kerakligini yozing, manzil va rasm qo'shing — bir daqiqada bo'ladi.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Sparkles,
      title: "AI ustalar tanlaydi",
      text: "Sun'iy intellekt buyurtmangizni tahlil qilib, eng mos ustalar ro'yxatini chiqaradi.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: HandshakeIcon,
      title: "Band qiling",
      text: "Ustani band qiling, u sizga qo'ng'iroq qiladi va kelishadi. Tamom!",
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30 border-y">
      <Container>
        <motion.div {...fadeInUp} className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            3 ta oson <span className="gradient-text">qadam</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Buyurtmadan ishni topshirishgacha bir necha daqiqa
          </p>
        </motion.div>

        <motion.div
          {...stagger}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              variants={fadeInUp}
              className="relative rounded-3xl border bg-card p-8 card-lift"
            >
              <div className="absolute -top-4 left-8 inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {idx + 1}
              </div>
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white mb-4 animate-float`}
                style={{ animationDelay: `${idx * 0.5}s` }}
              >
                <step.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

/* ─────────── CTA ─────────── */
function CtaSection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" />
      <div className="absolute inset-0 bg-grid opacity-50" />

      <Container className="relative">
        <motion.div
          {...fadeInUp}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-4 py-1.5 text-sm mb-6">
            <Phone className="h-4 w-4 text-primary" />
            Bepul va tez
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Birinchi <span className="gradient-text">buyurtmangizni</span> bering
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Hozir boshlasangiz, bir necha daqiqada eng mos ustalarni topasiz.
            Hech qanday to&apos;lov yoki obuna kerakmas.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" render={<Link href="/orders/new" />}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Boshlash
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
