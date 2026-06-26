export const USER_ROLES = [
  "customer",
  "local_brand",
  "stock_seller",
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

export function normalizeRole(
  role: UserRole | string | null | undefined,
): UserRole {
  const value = role ?? "";
  return isUserRole(value) ? value : "customer";
}
