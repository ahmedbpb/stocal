import type { ProductStatus } from "@/lib/seller/types";
import { formatProductStatus } from "@/lib/seller/product-helpers";

const STATUS_STYLES: Record<ProductStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 ring-red-500/30",
};

export function ProductStatusBadge({
  status,
  rejectionReason,
}: {
  status: ProductStatus;
  rejectionReason?: string | null;
}) {
  return (
    <div className="space-y-1">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 ${STATUS_STYLES[status]}`}
      >
        {formatProductStatus(status)}
      </span>
      {status === "rejected" && rejectionReason && (
        <p className="max-w-xs text-[11px] leading-snug text-red-400/90">
          {rejectionReason}
        </p>
      )}
    </div>
  );
}
