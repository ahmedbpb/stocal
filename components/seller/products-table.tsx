"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format-price";
import type { SellerProduct } from "@/lib/seller/types";
import { ProductStatusBadge } from "@/components/seller/product-status-badge";
import { deleteSellerProduct } from "@/app/seller/actions";

export function ProductsTable({ products }: { products: SellerProduct[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;

    setPendingId(id);
    startTransition(async () => {
      const result = await deleteSellerProduct(id);
      if (result.error) {
        alert(result.error);
      }
      setPendingId(null);
    });
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <p className="text-white/50">No products yet.</p>
        <Link
          href="/seller/products/new"
          className="mt-4 inline-flex rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
        >
          Upload your first product
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/40">
              <th className="px-4 py-4 font-medium sm:px-6">Product</th>
              <th className="px-4 py-4 font-medium sm:px-6">Category</th>
              <th className="px-4 py-4 font-medium sm:px-6">Price</th>
              <th className="px-4 py-4 font-medium sm:px-6">Stock</th>
              <th className="px-4 py-4 font-medium sm:px-6">Status</th>
              <th className="px-4 py-4 text-right font-medium sm:px-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {products.map((product) => (
              <tr
                key={product.id}
                className="transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/20">
                          —
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-white">{product.title}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-white/60 sm:px-6">
                  {product.category}
                </td>
                <td className="px-4 py-4 font-medium sm:px-6">
                  {formatPrice(product.price)}
                </td>
                <td className="px-4 py-4 text-white/60 sm:px-6">
                  {product.stockQuantity}
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <ProductStatusBadge
                    status={product.status}
                    rejectionReason={product.rejectionReason}
                  />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/seller/products/${product.id}/edit`}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/15"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      disabled={isPending && pendingId === product.id}
                      className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                    >
                      {isPending && pendingId === product.id
                        ? "…"
                        : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
