"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProductStock } from "@/app/admin/products/actions";
import { formatStockLabel, isOutOfStock } from "@/lib/inventory";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.07] disabled:opacity-50";

export default function EditProductClient({
  product,
}: {
  product: {
    id: string;
    title: string;
    productType: "local_brand" | "original_stock";
    category: string;
    price: number;
    stockQuantity: number;
  };
}) {
  const router = useRouter();
  const [stockQuantity, setStockQuantity] = useState(
    String(product.stockQuantity),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const result = await updateProductStock(product.id, stockQuantity);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <main className="mx-auto max-w-xl px-8 py-10">
        <Link
          href="/admin/products"
          className="text-xs uppercase tracking-wider text-white/40 hover:text-white/70"
        >
          ← Back to inventory
        </Link>

        <header className="mt-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            Edit Product
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {product.title}
          </h1>
          <p className="mt-2 text-sm text-white/40">
            {product.productType === "local_brand"
              ? "Local Brand"
              : "Original Stock"}{" "}
            · {product.category} · ${product.price.toFixed(2)}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8"
        >
          <div>
            <label
              htmlFor="stockQuantity"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50"
            >
              Stock Quantity
            </label>
            <input
              id="stockQuantity"
              type="number"
              min="0"
              step="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              disabled={saving}
              className={inputClass}
            />
            <p className="mt-2 text-xs text-white/30">
              Current status:{" "}
              {isOutOfStock(Number.parseInt(stockQuantity, 10) || 0)
                ? "Sold Out"
                : formatStockLabel(Number.parseInt(stockQuantity, 10) || 0)}
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-white py-3.5 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Stock"}
          </button>
        </form>
      </main>
    </div>
  );
}
