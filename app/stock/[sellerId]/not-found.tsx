import Link from "next/link";
import { StorefrontShell } from "@/components/storefront-shell";

export default function StockSellerNotFound() {
  return (
    <StorefrontShell
      backHref="/browse?type=stock_seller"
      backLabel="Original Stock"
      accent="stock"
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-20 text-center">
        <p className="text-lg font-medium text-white/60">Seller not found</p>
        <p className="mt-2 text-sm text-white/30">
          This stock seller doesn&apos;t exist or isn&apos;t available.
        </p>
        <Link
          href="/browse?type=stock_seller"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-6 text-sm font-bold uppercase tracking-wider text-black"
        >
          Browse Original Stock
        </Link>
      </div>
    </StorefrontShell>
  );
}
