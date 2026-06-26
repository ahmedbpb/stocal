import { ProductCard } from "@/components/product-card";
import type { ProductCardData } from "@/lib/browse/types";

type ProductGridProps = {
  products: ProductCardData[];
  accent?: "local" | "stock" | "neutral";
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ProductGrid({
  products,
  accent = "neutral",
  emptyTitle = "No products yet",
  emptyDescription = "Check back soon for new drops.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center backdrop-blur-md sm:px-8 sm:py-20">
        <p className="text-lg font-medium text-white/60">{emptyTitle}</p>
        <p className="mt-2 text-sm text-white/30">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} accent={accent} />
      ))}
    </div>
  );
}
