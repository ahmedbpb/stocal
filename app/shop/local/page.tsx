import Link from "next/link";
import { ShopProductGrid } from "@/components/ShopProductGrid";
import { getApprovedProducts } from "@/lib/shop-products";

export default async function LocalBrandsShopPage() {
  const products = await getApprovedProducts("local_brand");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-fuchsia-600/25 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[500px] rounded-full bg-pink-500/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-10">
          <Link
            href="/"
            className="text-xs uppercase tracking-wider text-white/40 hover:text-white/70"
          >
            ← Stocal
          </Link>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fuchsia-400/80">
                Homegrown · Independent
              </p>
              <h1
                className="mt-2 text-4xl font-black tracking-tight sm:text-5xl"
                style={{
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #f0abfc 60%, rgba(240,171,252,0.5) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Local Brands
              </h1>
              <p className="mt-3 max-w-lg text-sm text-white/40">
                Discover streetwear and fashion from the creators in your
                community — raw, original, and built from the ground up.
              </p>
            </div>
            <Link
              href="/shop/stocks"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-white/50 transition-colors hover:border-amber-500/30 hover:text-amber-300/90"
            >
              Browse Original Stocks →
            </Link>
          </div>
        </header>

        <ShopProductGrid
          products={products}
          accent="local"
          emptyTitle="No local brand listings yet"
          emptyDescription="Approved drops from independent labels will appear here soon."
        />
      </main>
    </div>
  );
}
