import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { isOutOfStock } from "@/lib/inventory";
import { formatPrice } from "@/lib/format-price";

type InventoryProduct = {
  id: string;
  title: string;
  productType: "local_brand" | "original_stock";
  category: string;
  price: number;
  stockQuantity: number;
};

export default async function AdminProductsPage() {
  const { supabase } = await requireSuperAdmin();

  const { data, error } = await supabase
    .from("products")
    .select("id, title, product_type, category, price, stock_quantity")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch inventory:", error.message);
  }

  const products: InventoryProduct[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    productType: row.product_type as InventoryProduct["productType"],
    category: row.category,
    price: Number(row.price),
    stockQuantity: Number(row.stock_quantity ?? 0),
  }));

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <Link
          href="/admin"
          className="text-xs uppercase tracking-wider text-white/40 hover:text-white/70"
        >
          ← Back to dashboard
        </Link>

        <header className="mt-6 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Product Inventory</h1>
          <p className="mt-2 text-sm text-white/40">
            Manage stock levels for live listings — especially original stock
            pieces with limited quantity.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/40">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-white/40"
                    >
                      No approved products yet.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {product.title}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            product.productType === "local_brand"
                              ? "bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/25"
                              : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25"
                          }`}
                        >
                          {product.productType === "local_brand"
                            ? "Local Brand"
                            : "Original Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4">
                        {isOutOfStock(product.stockQuantity) ? (
                          <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/70 ring-1 ring-white/10">
                            Sold Out
                          </span>
                        ) : (
                          <span className="text-white/80">
                            {product.stockQuantity}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
                        >
                          Edit Stock
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
