import type { UserRole } from "@/lib/auth/roles";

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  local_brand: "Local Brand",
  stock_seller: "Stock Seller",
  moderator: "Moderator",
  super_admin: "Admin",
};

const ROLE_STYLES: Record<UserRole, string> = {
  customer: "bg-white/10 text-white/70 ring-white/15",
  local_brand: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/25",
  stock_seller: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  moderator: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/25",
  super_admin: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function getRoleBadgeClass(role: UserRole): string {
  return ROLE_STYLES[role];
}

export function getStorefrontPath(
  userId: string,
  role: UserRole,
): string | null {
  if (role === "local_brand") return `/brands/${userId}`;
  if (role === "stock_seller") return `/stock/${userId}`;
  return null;
}

export function getProfileInitials(name: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
