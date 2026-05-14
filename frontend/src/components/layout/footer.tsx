import Link from "next/link";

import { Container } from "@/components/layout/container";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <Container className="py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-semibold mb-3">usta-call</h4>
            <p className="text-muted-foreground">
              Ustalar va mijozlarni bog&apos;lovchi platforma.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Mijozlar uchun</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/masters" className="hover:text-foreground">Ustalarni qidirish</Link></li>
              <li><Link href="/orders/new" className="hover:text-foreground">Buyurtma berish</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Ustalar uchun</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/register?role=master" className="hover:text-foreground">Usta sifatida ro&apos;yxatdan o&apos;tish</Link></li>
              <li><Link href="/how-it-works" className="hover:text-foreground">Qanday ishlaydi</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Aloqa</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>support@usta-call.uz</li>
              <li>+998 71 000 00 00</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t text-xs text-muted-foreground flex justify-between">
          <span>© {year} usta-call. Barcha huquqlar himoyalangan.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Maxfiylik</Link>
            <Link href="/terms" className="hover:text-foreground">Shartlar</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
