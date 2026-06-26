import { BrowsePageSkeleton, StorefrontHeaderSkeleton } from "@/components/browse-skeletons";
import { StorefrontShell } from "@/components/storefront-shell";

export default function StockStorefrontLoading() {
  return (
    <StorefrontShell
      backHref="/browse?type=stock_seller"
      backLabel="Original Stock"
      accent="stock"
    >
      <StorefrontHeaderSkeleton />
      <BrowsePageSkeleton />
    </StorefrontShell>
  );
}
