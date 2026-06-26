import { BrowsePageSkeleton, StorefrontHeaderSkeleton } from "@/components/browse-skeletons";
import { StorefrontShell } from "@/components/storefront-shell";

export default function BrandStorefrontLoading() {
  return (
    <StorefrontShell
      backHref="/browse?type=local_brand"
      backLabel="Local Brands"
      accent="local"
    >
      <StorefrontHeaderSkeleton />
      <BrowsePageSkeleton />
    </StorefrontShell>
  );
}
