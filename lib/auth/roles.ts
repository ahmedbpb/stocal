export const USER_ROLES = [
  "customer",
  "local_brand",
  "stock_seller",
  "moderator",
  "super_admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Platform admin role — grants access to /admin routes. */
export const ADMIN_ROLE = "super_admin" as const satisfies UserRole;

export function isUserRole(role: unknown): role is UserRole {
  return (
    typeof role === "string" &&
    (USER_ROLES as readonly string[]).includes(role)
  );
}

export function isAdminRole(
  role: UserRole | string | null | undefined,
): role is typeof ADMIN_ROLE {
  return role === ADMIN_ROLE;
}

export function isSellerRole(
  role: UserRole | string | null | undefined,
): role is "local_brand" | "stock_seller" {
  return role === "local_brand" || role === "stock_seller";
}

export function isModeratorRole(
  role: UserRole | string | null | undefined,
): boolean {
  return role === "moderator" || role === "super_admin";
}

export function normalizeRole(
  role: UserRole | string | null | undefined,
): UserRole {
  const value = role ?? "";
  return isUserRole(value) ? value : "customer";
}
