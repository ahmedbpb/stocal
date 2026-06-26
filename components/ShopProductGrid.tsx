import Link from "next/link";
import type { ShopProduct } from "@/lib/shop-products";
import { isOutOfStock } from "@/lib/inventory";
import { formatPrice } from "@/lib/format-price";

type ShopProductGridProps = {
  products: ShopProduct[];
  emptyTitle: string;
  emptyDescription: string;
  accent: "local" | "stock";
};

export function ShopProductGrid({
  products,
  emptyTitle,
  emptyDescription,
  accent,
}: ShopProductGridProps) {
  const ctaHover =
    accent === "local"
      ? "hover:bg-fuchsia-500 hover:text-white hover:border-fuchsia-400"
      : "hover:bg-amber-500 hover:text-black hover:border-amber-400";

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-20 text-center backdrop-blur-md">
        <p className="text-lg font-medium text-white/60">{emptyTitle}</p>
        <p className="mt-2 text-sm text-white/30">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-4">
      {products.map((product) => {
        const imageUrl = product.image_urls?.[0];
        const soldOut = isOutOfStock(product.stock_quantity);
        const brandLabel =
          product.product_type === "local_brand"
            ? (product.brand_name ?? "Local Brand")
            : "Original Stock";

        return (
          <article
            key={product.id}
            className={`group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.06] ${soldOut ? "opacity-75" : ""}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-white/[0.03]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.title}
                  className={`h-full w-full object-cover transition-transform duration-500 ${soldOut ? "grayscale-[0.35]" : "group-hover:scale-105"}`}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white/20">
                  <svg
                    className="h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <div className="absolute left-3 top-3 flex flex-col gap-2">
                {soldOut && (
                  <span className="rounded-full bg-neutral-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur-md">
                    Sold Out
                  </span>
                )}
                {product.defect_declared && (
                  <span className="rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                    Defect Declared
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 sm:p-4 lg:p-5">
              <p className="truncate text-[10px] uppercase tracking-wider text-white/40 sm:text-xs">
                {brandLabel} · {product.category}
              </p>
              <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-white sm:text-base lg:text-lg">
                {product.title}
              </h2>
              <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <p className="text-base font-bold tracking-tight sm:text-xl">
                  {formatPrice(Number(product.price))}
                </p>
                <Link
                  href={`/product/${product.id}`}
                  className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-[10px] font-semibold uppercase tracking-wider text-white transition-all sm:px-4 sm:text-xs ${ctaHover}`}
                >
                  View Details
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
