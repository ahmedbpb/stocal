"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SellerSession } from "@/lib/auth/require-seller";

const NAV_ITEMS = [
  { href: "/seller/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/seller/products", label: "Products", icon: "▣" },
  { href: "/seller/products/new", label: "Upload", icon: "＋" },
  { href: "/seller/orders", label: "Orders", icon: "◎" },
] as const;

function roleLabel(role: SellerSession["role"]) {
  return role === "local_brand" ? "Local Brand" : "Original Stock";
}

export function SellerShell({
  seller,
  children,
}: {
  seller: SellerSession;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#080808] text-white">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0c0c0c] md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-6">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${
              seller.role === "local_brand"
                ? "bg-gradient-to-br from-fuchsia-500 to-violet-500"
                : "bg-gradient-to-br from-amber-500 to-orange-500"
            }`}
          >
            S
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">Seller Hub</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
              {roleLabel(seller.role)}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/seller/products"
                ? pathname === "/seller/products" ||
                  (pathname.startsWith("/seller/products/") &&
                    !pathname.startsWith("/seller/products/new"))
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <span className="text-xs opacity-60">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/[0.06] p-4">
          <Link
            href="/"
            className="block rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center text-xs font-medium text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            View Storefront →
          </Link>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-xs text-white/40">Logged in as</p>
            <p className="mt-0.5 truncate text-sm font-medium">
              {seller.fullName ?? "Seller"}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-8">
            <nav className="flex gap-1 overflow-x-auto md:hidden">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <p className="hidden text-sm font-medium text-white/60 md:block">
              {roleLabel(seller.role)} Dashboard
            </p>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
