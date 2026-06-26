import { SellerTableSkeleton } from "@/components/seller/seller-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-52 animate-pulse rounded bg-white/10" />
      </div>
      <SellerTableSkeleton />
    </div>
  );
}
