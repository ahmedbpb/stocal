import { Suspense } from "react";
import { BrowseFilters } from "@/components/browse-filters";
import { ProductGrid } from "@/components/product-grid";
import { BrowsePageSkeleton } from "@/components/browse-skeletons";
import { parseBrowseSearchParams } from "@/lib/browse/parse-params";
import {
  browseProducts,
  getDistinctCategories,
} from "@/lib/browse/queries";

type BrowsePageProps = {
  searchParams: Promise<{ type?: string; category?: string }>;
};

function browseTitle(type: string | null, category: string | null): string {
  if (type === "local_brand" && category) return `${category} · Local Brands`;
  if (type === "stock_seller" && category) return `${category} · Original Stock`;
  if (type === "local_brand") return "Local Brands";
  if (type === "stock_seller") return "Original Stock";
  if (category) return category;
  return "Browse All";
}

function browseAccent(
  type: string | null,
): "local" | "stock" | "neutral" {
  if (type === "local_brand") return "local";
  if (type === "stock_seller") return "stock";
  return "neutral";
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const raw = await searchParams;
  const { type, category } = parseBrowseSearchParams(raw);

  const [products, categories] = await Promise.all([
    browseProducts({ type, category }),
    getDistinctCategories(type),
  ]);

  const title = browseTitle(type, category);
  const accent = browseAccent(type);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
            Stocal Shop
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/40">
            {products.length} product{products.length === 1 ? "" : "s"} · newest
            first
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <Suspense fallback={<div className="hidden h-40 animate-pulse rounded-2xl bg-white/[0.04] lg:block" />}>
            <BrowseFilters
              categories={categories}
              currentType={type}
              currentCategory={category}
            />
          </Suspense>

          <ProductGrid
            products={products}
            accent={accent}
            emptyTitle="No products found"
            emptyDescription={
              type || category
                ? "Try adjusting your filters to see more listings."
                : "Approved listings will appear here once sellers publish."
            }
          />
        </div>
      </main>
    </div>
  );
}
