import Link from "next/link";
import { Wrench } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 font-bold text-xl mb-8"
        >
          <Wrench className="h-6 w-6 text-primary" />
          <span>usta-call</span>
        </Link>
        <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
