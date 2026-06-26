import { SellerFormSkeleton } from "@/components/seller/seller-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-64 animate-pulse rounded bg-white/10" />
      </div>
      <SellerFormSkeleton />
    </div>
  );
}
