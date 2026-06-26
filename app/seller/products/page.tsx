import Link from "next/link";
import { ProductsTable } from "@/components/seller/products-table";
import { requireSeller } from "@/lib/auth/require-seller";
import { getSellerProducts } from "@/lib/seller/queries";

type Props = {
  searchParams: Promise<{ success?: string }>;
};

export default async function SellerProductsPage({ searchParams }: Props) {
  const seller = await requireSeller();
  const products = await getSellerProducts(seller.userId);
  const { success } = await searchParams;

  const successMessage =
    success === "created"
      ? "Product submitted for approval."
      : success === "updated"
        ? "Product updated and re-submitted for approval."
        : null;

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-white/40">
            Manage your listings and approval status
          </p>
        </div>
        <Link
          href="/seller/products/new"
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Upload new
        </Link>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
