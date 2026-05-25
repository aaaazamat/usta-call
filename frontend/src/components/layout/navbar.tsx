"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LogOut,
  Menu as MenuIcon,
  User as UserIcon,
  Wrench,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/lib/auth/store";
import { Link, usePathname } from "@/i18n/navigation";

interface NavLink {
  href: string;
  labelKey: string;
}

const GUEST_LINKS: NavLink[] = [
  { href: "/masters", labelKey: "masters" },
  { href: "/orders/new", labelKey: "newOrder" },
  { href: "/how-it-works", labelKey: "howItWorks" },
];

const CLIENT_LINKS: NavLink[] = [
  { href: "/masters", labelKey: "masters" },
  { href: "/orders/new", labelKey: "newOrder" },
  { href: "/orders", labelKey: "orders" },
  { href: "/bookings", labelKey: "bookings" },
];

const MASTER_LINKS: NavLink[] = [
  { href: "/orders/feed", labelKey: "orders" },
  { href: "/bookings", labelKey: "bookings" },
  { href: "/dashboard", labelKey: "dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links: NavLink[] = !user
    ? GUEST_LINKS
    : user.role === "master"
      ? MASTER_LINKS
      : CLIENT_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-16 md:h-20 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 md:gap-3 font-bold group shrink-0"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative inline-flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 text-white shadow-md group-hover:scale-105 transition-transform">
              <Wrench className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </div>
          <span className="text-lg md:text-2xl tracking-tight">
            usta<span className="gradient-text">-call</span>
          </span>
        </Link>

        {/* Desktop nav linklari */}
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
                {t(link.labelKey)}
                {active && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-[3px] rounded-full bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* O'ng tarafdagi tugmalar */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition hover:opacity-80">
                <Avatar className="h-9 w-9 md:h-11 md:w-11 ring-2 ring-background shadow-sm">
                  <AvatarImage src={user.avatar ?? undefined} alt={user.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-medium">
                    {user.full_name?.[0] ?? <UserIcon className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {user.full_name || t("profile")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.phone ?? user.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/profile" />}>
                  {t("profile")}
                </DropdownMenuItem>
                {user.role === "master" ? (
                  <>
                    <DropdownMenuItem render={<Link href="/dashboard" />}>
                      {t("dashboard")}
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/bookings" />}>
                      {t("bookings")}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem render={<Link href="/orders" />}>
                      {t("orders")}
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/bookings" />}>
                      {t("bookings")}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" /> {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline-flex items-center h-11 px-5 text-base font-medium rounded-xl text-foreground hover:bg-muted transition-colors"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="relative hidden md:inline-flex items-center h-11 px-6 text-base font-semibold rounded-xl text-white shadow-md hover:shadow-xl transition-all bg-gradient-to-br from-primary via-purple-500 to-pink-500 hover:scale-105 active:scale-100"
              >
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 blur-md opacity-40 -z-10" />
                {t("register")}
              </Link>
            </>
          )}

          {/* Mobile hamburger menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl hover:bg-muted transition-colors">
              <MenuIcon className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[340px] p-0">
              <SheetHeader className="border-b p-4 flex flex-row items-center justify-between">
                <SheetTitle className="text-left">{t("home")}</SheetTitle>
                <LanguageSwitcher />
              </SheetHeader>

              <nav className="flex flex-col p-2">
                {links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={
                        "flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors " +
                        (active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted")
                      }
                    >
                      {t(link.labelKey)}
                      {active && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}

                {!user && (
                  <div className="mt-3 pt-3 border-t flex flex-col gap-2 px-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center h-11 px-5 text-base font-medium rounded-xl border hover:bg-muted transition-colors"
                    >
                      {t("login")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center justify-center h-11 px-5 text-base font-semibold rounded-xl text-white shadow-md bg-gradient-to-br from-primary via-purple-500 to-pink-500 active:scale-95"
                    >
                      {t("register")}
                    </Link>
                  </div>
                )}

                {user && (
                  <div className="mt-3 pt-3 border-t px-2">
                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      {t("profile")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-3 rounded-xl text-base font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("logout")}
                    </button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
