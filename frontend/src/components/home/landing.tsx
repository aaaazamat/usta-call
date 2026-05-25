"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useTranslations } from "next-intl";
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
import { Link } from "@/i18n/navigation";
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
  const t = useTranslations("home");
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

      <Container className="relative py-16 md:py-32">
        <motion.div style={{ y, opacity }} className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border bg-white/80 backdrop-blur px-3 md:px-4 py-1.5 text-xs md:text-sm text-muted-foreground mb-5 md:mb-6 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary animate-pulse" />
            {t("heroBadge")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] md:leading-[1.05] mb-5 md:mb-6"
          >
            {t("heroTitle1")} <br className="hidden sm:block" />
            <span className="gradient-text">{t("heroTitleAccent")}</span> {t("heroTitle2")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto px-2"
          >
            {t("heroSubtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0"
          >
            <Button size="lg" render={<Link href="/orders/new" />} className="w-full sm:w-auto">
              {t("ctaPostJob")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/masters" />}
              className="w-full sm:w-auto"
            >
              {t("ctaFindMaster")}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 md:mt-12 flex items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground"
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
              <div className="text-xs">{t("trustBadge")}</div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

/* ─────────── Categories ─────────── */
function CategoriesSection() {
  const t = useTranslations("home");
  const { data: categories } = useCategories();
  const topCategories = categories?.filter((c) => !c.parent) ?? [];

  return (
    <section className="py-14 md:py-28 bg-background">
      <Container>
        <motion.div {...fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t("categoriesTitle1")}{" "}
            <span className="gradient-text">{t("categoriesTitleAccent")}</span>{" "}
            {t("categoriesTitle2")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("categoriesSubtitle")}
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
  const t = useTranslations("home.stats");
  const stats = [
    { value: "30+", label: t("masters"), icon: Users },
    { value: "100%", label: t("free"), icon: ShieldCheck },
    { value: "AI", label: t("ai"), icon: Sparkles },
    { value: "24/7", label: t("always"), icon: MessageCircle },
  ];

  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-y">
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
  const t = useTranslations("home");
  const { data, isLoading } = useMasters({ ordering: "-rating_cache" });
  const masters = data?.results.slice(0, 6) ?? [];

  return (
    <section className="py-14 md:py-28">
      <Container>
        <motion.div {...fadeInUp} className="flex items-end justify-between gap-4 mb-10 flex-wrap">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3">
              <span className="gradient-text">{t("topMasters1")}</span> {t("topMasters2")}
            </h2>
            <p className="text-muted-foreground">{t("topMastersSubtitle")}</p>
          </div>
          <Link
            href="/masters"
            className="text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            {t("viewAll")} <ArrowRight className="h-4 w-4" />
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
                            <span>· {t("workCount", { count: m.completed_orders_cache })}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {t("newMaster")}
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
  const t = useTranslations("home");
  const steps = [
    {
      icon: ClipboardList,
      title: t("step1Title"),
      text: t("step1Text"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Sparkles,
      title: t("step2Title"),
      text: t("step2Text"),
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: HandshakeIcon,
      title: t("step3Title"),
      text: t("step3Text"),
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30 border-y">
      <Container>
        <motion.div {...fadeInUp} className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t("howItWorksTitle1")}{" "}
            <span className="gradient-text">{t("howItWorksTitleAccent")}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("howItWorksSubtitle")}
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
  const t = useTranslations("home");
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
            {t("ctaBadge")}
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            {t("ctaTitle1")}{" "}
            <span className="gradient-text">{t("ctaTitleAccent")}</span>{" "}
            {t("ctaTitle2")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            {t("ctaSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" render={<Link href="/orders/new" />}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t("ctaStart")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/register?role=master" />}
            >
              {t("ctaJoinMaster")}
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
