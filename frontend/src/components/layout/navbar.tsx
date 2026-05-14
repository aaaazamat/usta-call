"use client";

import Link from "next/link";
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
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const links: NavLink[] = !user
    ? GUEST_LINKS
    : user.role === "master"
      ? MASTER_LINKS
      : CLIENT_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Wrench className="h-5 w-5 text-primary" />
          <span>usta-call</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar ?? undefined} alt={user.full_name} />
                  <AvatarFallback>
                    {user.full_name?.[0] ?? <UserIcon className="h-4 w-4" />}
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
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Kirish
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
                Ro&apos;yxatdan o&apos;tish
              </Button>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
