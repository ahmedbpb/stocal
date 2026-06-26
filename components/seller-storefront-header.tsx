import Image from "next/image";
import type { SellerProfile } from "@/lib/browse/types";
import { getSellerDisplayName } from "@/lib/browse/utils";

type SellerStorefrontHeaderProps = {
  seller: SellerProfile;
  productCount: number;
  accent: "local" | "stock";
};

const ACCENT = {
  local: {
    badge: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/25",
    glow: "bg-fuchsia-600/20",
    label: "Local Brand",
  },
  stock: {
    badge: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
    glow: "bg-amber-500/15",
    label: "Original Stock Seller",
  },
};

export function SellerStorefrontHeader({
  seller,
  productCount,
  accent,
}: SellerStorefrontHeaderProps) {
  const styles = ACCENT[accent];
  const displayName = getSellerDisplayName(
    seller,
    accent === "local" ? "Local Brand" : "Stock Seller",
  );
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md sm:p-8">
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[80px] ${styles.glow}`}
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] sm:h-24 sm:w-24">
          {seller.avatar_url ? (
            <Image
              src={seller.avatar_url}
              alt={displayName}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-xl font-bold text-white">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles.badge}`}
          >
            {styles.label}
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            {displayName}
          </h1>
          {seller.bio?.trim() ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
              {seller.bio}
            </p>
          ) : (
            <p className="mt-2 text-sm text-white/30">
              {productCount === 0
                ? "No listings yet."
                : `${productCount} listing${productCount === 1 ? "" : "s"} available`}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
