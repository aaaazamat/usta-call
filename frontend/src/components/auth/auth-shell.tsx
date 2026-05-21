"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  Sparkles,
  Star,
  Users,
  Wrench,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI yordamida tezkor moslashtirish",
    text: "Buyurtmangizni AI tahlil qiladi va eng mos ustani topadi",
  },
  {
    icon: Users,
    title: "30+ tasdiqlangan ustalar",
    text: "Santexnik, elektrik, quruvchi va boshqa mutaxassislar",
  },
  {
    icon: Phone,
    title: "Tezkor bog'lanish",
    text: "Band qiling va telefon orqali bevosita gaplashing",
  },
  {
    icon: CheckCircle2,
    title: "Bepul va xavfsiz",
    text: "Hech qanday obuna yoki to'lov yo'q",
  },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      {/* Background dekoratsiya */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />

      <div className="relative grid lg:grid-cols-2 min-h-[calc(100vh-5rem)]">
        {/* Chap taraf — branding va xususiyatlar */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden lg:flex flex-col justify-between p-12 xl:p-16"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Bosh sahifaga qaytish
          </Link>

          <div className="space-y-8 max-w-md">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 text-white shadow-xl">
                  <Wrench className="h-7 w-7" />
                </div>
              </div>
              <span className="text-3xl font-bold tracking-tight">
                usta<span className="gradient-text">-call</span>
              </span>
            </Link>

            <div className="space-y-2">
              <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
                Kerakli ustani <br />
                <span className="gradient-text">bir daqiqada</span> toping
              </h2>
              <p className="text-muted-foreground">
                Eng yaxshi ustalar bilan ishlamoqchimisiz? Yoki ish topmoqchimisiz?
                Ro&apos;yxatdan o&apos;ting va boshlang.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((f, idx) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-background/80 backdrop-blur border shadow-sm">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{f.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {f.text}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex items-center gap-3 pt-4 border-t border-border/50"
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">500+</span> mamnun
                mijozlar
              </div>
            </motion.div>
          </div>

          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} usta-call. Barcha huquqlar himoyalangan.
          </div>
        </motion.div>

        {/* O'ng taraf — auth forma */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-center p-6 sm:p-12"
        >
          <div className="w-full max-w-md">
            {/* Mobile uchun logo (chap panel yashirilganda) */}
            <Link
              href="/"
              className="lg:hidden flex items-center justify-center gap-2.5 mb-8 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-xl blur-md opacity-50" />
                <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 text-white shadow-md">
                  <Wrench className="h-5 w-5" />
                </div>
              </div>
              <span className="text-2xl font-bold">
                usta<span className="gradient-text">-call</span>
              </span>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl"
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
