import Link from "next/link";
import { StorefrontShell } from "@/components/storefront-shell";

export default function BrandNotFound() {
  return (
    <StorefrontShell
      backHref="/browse?type=local_brand"
      backLabel="Local Brands"
      accent="local"
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-20 text-center">
        <p className="text-lg font-medium text-white/60">Brand not found</p>
        <p className="mt-2 text-sm text-white/30">
          This local brand doesn&apos;t exist or isn&apos;t available.
        </p>
        <Link
          href="/browse?type=local_brand"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-6 text-sm font-bold uppercase tracking-wider text-black"
        >
          Browse Local Brands
        </Link>
      </div>
    </StorefrontShell>
  );
}
