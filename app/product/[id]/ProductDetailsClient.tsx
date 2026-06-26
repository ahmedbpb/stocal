"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/cart/actions";
import { formatStockLabel, isOutOfStock } from "@/lib/inventory";
import { notifyCartUpdated } from "@/lib/cart/types";
import type { ProductDetail } from "./types";

type Toast = {
  message: string;
  type: "success" | "error";
};

function ToastNotification({ toast }: { toast: Toast }) {
  return (
    <div
      className={`fixed bottom-6 left-4 right-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border px-5 py-3.5 shadow-2xl backdrop-blur-md sm:left-auto sm:right-6 ${
        toast.type === "success"
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
          : "border-red-500/30 bg-red-500/15 text-red-200"
      }`}
    >
      {toast.type === "success" ? (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
}

function VariantPills({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`min-h-11 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-white/[0.04] text-white/70 hover:border-white/30 hover:text-white"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProductDetailsClient({
  product,
}: {
  product: ProductDetail;
}) {
  const router = useRouter();
  const images = product.image_urls ?? [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];
  const requiresSize = sizes.length > 0;
  const requiresColor = colors.length > 0;
  const outOfStock = isOutOfStock(product.stock_quantity);
  const canAddToCart =
    !outOfStock &&
    (!requiresSize || selectedSize) &&
    (!requiresColor || selectedColor);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  async function handleAddToCart() {
    if (!canAddToCart) return;

    setAdding(true);

    const result = await addToCart(product.id, selectedSize, selectedColor);

    if (result.error) {
      if (result.error.includes("sign in")) {
        router.push("/login");
        return;
      }
      showToast(result.error, "error");
    } else {
      notifyCartUpdated();
      showToast("Added to cart!", "success");
    }

    setAdding(false);
  }

  const brandLabel =
    product.product_type === "local_brand"
      ? product.brand_name ?? "Local Brand"
      : "Original Stock";

  const mainImage = images[selectedIndex];

  return (
    <>
      {toast && <ToastNotification toast={toast} />}

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href={
            product.product_type === "local_brand"
              ? "/shop/local"
              : "/shop/stocks"
          }
          className="text-xs uppercase tracking-wider text-white/40 hover:text-white/70"
        >
          ← Back to{" "}
          {product.product_type === "local_brand"
            ? "Local Brands"
            : "Original Stocks"}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] aspect-[4/5]">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center text-white/20">
                  <svg
                    className="h-20 w-20"
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
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`overflow-hidden rounded-xl border aspect-square transition-all ${
                      selectedIndex === index
                        ? "border-white/50 ring-2 ring-white/20"
                        : "border-white/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${product.title} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  product.product_type === "local_brand"
                    ? "bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/25"
                    : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25"
                }`}
              >
                {product.product_type === "local_brand"
                  ? "Local Brand"
                  : "Original Stock"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white/50">
                {product.category}
              </span>
              {product.condition && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white/50">
                  {product.condition}
                </span>
              )}
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              {product.title}
            </h1>
            <p className="mt-2 text-sm text-white/50">{brandLabel}</p>

            <p className="mt-6 text-4xl font-bold tracking-tight">
              ${Number(product.price).toFixed(2)}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {outOfStock ? (
                <span className="rounded-full bg-neutral-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/15">
                  Out of Stock
                </span>
              ) : (
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
                  {formatStockLabel(product.stock_quantity)}
                </span>
              )}
            </div>

            {product.description && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Description
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  {product.description}
                </p>
              </div>
            )}

            {product.defect_declared && (
              <div className="mt-6 rounded-2xl border border-orange-500/30 bg-orange-500/[0.08] p-6 ring-1 ring-orange-500/20">
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold text-orange-200">
                      Condition Disclosure
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">
                      {product.defect_description}
                    </p>
                    {images.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {images.map((url, index) => (
                          <button
                            key={`defect-${url}`}
                            type="button"
                            onClick={() => setSelectedIndex(index)}
                            className="overflow-hidden rounded-lg border border-orange-500/20 aspect-square"
                          >
                            <img
                              src={url}
                              alt={`Condition proof ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(requiresSize || requiresColor) && (
              <div className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
                {requiresSize && (
                  <VariantPills
                    label="Select Size"
                    options={sizes}
                    selected={selectedSize}
                    onSelect={setSelectedSize}
                  />
                )}
                {requiresColor && (
                  <VariantPills
                    label="Select Color"
                    options={colors}
                    selected={selectedColor}
                    onSelect={setSelectedColor}
                  />
                )}
              </div>
            )}

            {!outOfStock &&
              !canAddToCart &&
              (requiresSize || requiresColor) && (
              <p className="mt-4 text-sm text-white/40">
                {requiresSize && !selectedSize && requiresColor && !selectedColor
                  ? "Select a size and color to add to cart."
                  : requiresSize && !selectedSize
                    ? "Select a size to add to cart."
                    : "Select a color to add to cart."}
              </p>
            )}

            {outOfStock && (
              <p className="mt-4 text-sm text-white/40">
                This item is currently sold out. Check back later for restocks.
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding || !canAddToCart}
                className="min-h-11 w-full rounded-xl bg-white px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gradient-to-r hover:from-violet-500 hover:via-fuchsia-500 hover:to-cyan-400 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-12"
              >
                {outOfStock
                  ? "Sold Out"
                  : adding
                    ? "Adding…"
                    : "Add to Cart"}
              </button>
              <Link
                href="/cart"
                className="inline-flex min-h-11 items-center justify-center text-center text-xs font-medium uppercase tracking-wider text-white/40 transition-colors hover:text-white/70"
              >
                View Cart →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
