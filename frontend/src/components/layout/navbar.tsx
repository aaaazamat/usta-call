"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User as UserIcon, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/auth/store";

interface NavLink {
  href: string;
  label: string;
}

const GUEST_LINKS: NavLink[] = [
  { href: "/masters", label: "Ustalar" },
  { href: "/orders/new", label: "Buyurtma berish" },
  { href: "/how-it-works", label: "Qanday ishlaydi" },
];

const CLIENT_LINKS: NavLink[] = [
  { href: "/masters", label: "Ustalar" },
  { href: "/orders/new", label: "Buyurtma berish" },
  { href: "/orders", label: "Buyurtmalarim" },
  { href: "/bookings", label: "So'rovlarim" },
];

const MASTER_LINKS: NavLink[] = [
  { href: "/orders/feed", label: "Buyurtmalar" },
  { href: "/bookings", label: "Kelgan so'rovlar" },
  { href: "/dashboard", label: "Usta paneli" },
];

export function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const links: NavLink[] = !user
    ? GUEST_LINKS
    : user.role === "master"
      ? MASTER_LINKS
      : CLIENT_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-20 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 font-bold text-xl group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 text-white shadow-md group-hover:scale-105 transition-transform">
              <Wrench className="h-6 w-6" />
            </div>
          </div>
          <span className="hidden sm:inline text-2xl tracking-tight">
            usta<span className="gradient-text">-call</span>
          </span>
        </Link>

        {/* Asosiy nav linklari */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "relative px-4 py-2.5 rounded-xl text-base font-medium transition-all " +
                  (active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60")
                }
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-[3px] rounded-full bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* O'ng tarafdagi tugmalar */}
        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition hover:opacity-80">
                <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
                  <AvatarImage src={user.avatar ?? undefined} alt={user.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-medium text-base">
                    {user.full_name?.[0] ?? <UserIcon className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {user.full_name || "Foydalanuvchi"}
                    </span>
                    <span className="text-xs text-muted-foreground">{user.phone}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/profile" />}>
                  Profil
                </DropdownMenuItem>
                {user.role === "master" ? (
                  <>
                    <DropdownMenuItem render={<Link href="/dashboard" />}>
                      Usta paneli
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/bookings" />}>
                      Kelgan so&apos;rovlar
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem render={<Link href="/orders" />}>
                      Buyurtmalarim
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/bookings" />}>
                      So&apos;rovlarim
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center h-11 px-5 text-base font-medium rounded-xl text-foreground hover:bg-muted transition-colors"
              >
                Kirish
              </Link>
              <Link
                href="/register"
                className="relative inline-flex items-center h-11 px-6 text-base font-semibold rounded-xl text-white shadow-md hover:shadow-xl transition-all bg-gradient-to-br from-primary via-purple-500 to-pink-500 hover:scale-105 active:scale-100"
              >
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 blur-md opacity-40 -z-10" />
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
