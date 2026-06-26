import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { VariantPreview } from "@/components/variant-preview";
import { isOutOfStock } from "@/lib/inventory";
import { formatPrice } from "@/lib/format-price";
import type { ProductCardData } from "@/lib/browse/types";

type ProductCardProps = {
  product: ProductCardData;
  accent?: "local" | "stock" | "neutral";
};

export function ProductCard({ product, accent = "neutral" }: ProductCardProps) {
  const imageUrl = product.image_urls?.[0];
  const soldOut = isOutOfStock(product.stock_quantity);
  const colors = product.colors ?? [];
  const sizes = product.sizes ?? [];
  const brandLabel =
    product.product_type === "local_brand"
      ? (product.brand_name ?? "Local Brand")
      : "Original Stock";

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.06] ${soldOut ? "opacity-75" : ""}`}
    >
      <Link
        href={`/product/${product.id}`}
        className="relative aspect-[4/5] overflow-hidden bg-white/[0.03]"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-500 ${soldOut ? "grayscale-[0.35]" : "group-hover:scale-105"}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/20">
            <svg
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
              aria-hidden
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
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="truncate text-[10px] uppercase tracking-wider text-white/40 sm:text-xs">
          {brandLabel} · {product.category}
        </p>
        <Link href={`/product/${product.id}`}>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors hover:text-white/80 sm:text-base">
            {product.title}
          </h3>
        </Link>
        <VariantPreview colors={colors} sizes={sizes} />
        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="text-base font-bold tracking-tight sm:text-lg">
            {formatPrice(Number(product.price))}
          </p>
          <AddToCartButton product={product} accent={accent} />
        </div>
      </div>
    </article>
  );
}
