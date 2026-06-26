"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addToCart } from "@/app/cart/actions";
import { notifyCartUpdated } from "@/lib/cart/types";
import { isOutOfStock } from "@/lib/inventory";
import type { ProductCardData } from "@/lib/browse/types";

type AddToCartButtonProps = {
  product: Pick<
    ProductCardData,
    "id" | "stock_quantity" | "sizes" | "colors" | "has_variants"
  >;
  className?: string;
  accent?: "local" | "stock" | "neutral";
};

function needsVariantSelection(
  product: Pick<ProductCardData, "sizes" | "colors" | "has_variants">,
): boolean {
  return (
    product.has_variants === true ||
    (product.sizes?.length ?? 0) > 0 ||
    (product.colors?.length ?? 0) > 0
  );
}

const ACCENT_STYLES = {
  local:
    "border-white/15 bg-white/10 text-white hover:bg-fuchsia-500 hover:text-white hover:border-fuchsia-400",
  stock:
    "border-white/15 bg-white/10 text-white hover:bg-amber-500 hover:text-black hover:border-amber-400",
  neutral:
    "border-white/15 bg-white/10 text-white hover:bg-white hover:text-black hover:border-white",
};

export function AddToCartButton({
  product,
  className = "",
  accent = "neutral",
}: AddToCartButtonProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const soldOut = isOutOfStock(product.stock_quantity);
  const requiresOptions = needsVariantSelection(product);

  async function handleAdd() {
    if (soldOut || requiresOptions) return;

    setAdding(true);
    const result = await addToCart(product.id, null, null);

    if (result.error) {
      if (result.error.includes("sign in")) {
        router.push("/login");
        return;
      }
    } else {
      notifyCartUpdated();
    }

    setAdding(false);
  }

  const baseClass = `inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-[10px] font-semibold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-xs ${ACCENT_STYLES[accent]} ${className}`;

  if (soldOut) {
    return (
      <button type="button" disabled className={baseClass}>
        Sold Out
      </button>
    );
  }

  if (requiresOptions) {
    return (
      <Link href={`/product/${product.id}`} className={baseClass}>
        Choose Options
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={adding}
      className={baseClass}
    >
      {adding ? "Adding…" : "Add to Cart"}
    </button>
  );
}
