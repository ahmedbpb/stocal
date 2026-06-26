import Link from "next/link";
import { ShopProductGrid } from "@/components/ShopProductGrid";
import { getApprovedProducts } from "@/lib/shop-products";

export default async function OriginalStocksShopPage() {
  const products = await getApprovedProducts("original_stock");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 top-0 h-[500px] w-[500px] rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="absolute -left-32 top-1/3 h-[400px] w-[400px] rounded-full bg-yellow-600/10 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[500px] rounded-full bg-orange-500/10 blur-[100px]" />
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
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/80">
                Verified · Authentic
              </p>
              <h1
                className="mt-2 text-4xl font-black tracking-tight sm:text-5xl"
                style={{
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #fcd34d 60%, rgba(252,211,77,0.5) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Original Stocks
              </h1>
              <p className="mt-3 max-w-lg text-sm text-white/40">
                Premium pieces from established labels — authenticated, quality
                checked, and ready to ship.
              </p>
            </div>
            <Link
              href="/shop/local"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-white/50 transition-colors hover:border-fuchsia-500/30 hover:text-fuchsia-300/90"
            >
              Browse Local Brands →
            </Link>
          </div>
        </header>

        <ShopProductGrid
          products={products}
          accent="stock"
          emptyTitle="No original stock listings yet"
          emptyDescription="Verified premium pieces will appear here once approved."
        />
      </main>
    </div>
  );
}
