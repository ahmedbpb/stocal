import Link from "next/link";
import type { ReactNode } from "react";

type StorefrontShellProps = {
  backHref: string;
  backLabel: string;
  accent: "local" | "stock";
  children: ReactNode;
};

const GLOW = {
  local: {
    left: "bg-fuchsia-600/25",
    right: "bg-violet-600/20",
    bottom: "bg-pink-500/10",
  },
  stock: {
    left: "bg-amber-500/20",
    right: "bg-yellow-600/10",
    bottom: "bg-orange-500/10",
  },
};

export function StorefrontShell({
  backHref,
  backLabel,
  accent,
  children,
}: StorefrontShellProps) {
  const glow = GLOW[accent];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute -left-32 top-0 h-[500px] w-[500px] rounded-full blur-[120px] ${glow.left}`}
        />
        <div
          className={`absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full blur-[100px] ${glow.right}`}
        />
        <div
          className={`absolute bottom-0 left-1/4 h-[300px] w-[500px] rounded-full blur-[100px] ${glow.bottom}`}
        />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href={backHref}
          className="text-xs uppercase tracking-wider text-white/40 hover:text-white/70"
        >
          ← {backLabel}
        </Link>
        <div className="mt-6 space-y-10">{children}</div>
      </main>
    </div>
  );
}
