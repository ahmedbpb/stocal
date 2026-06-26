export const USER_ROLES = [
  "customer",
  "local_brand",
  "stock_seller",
  "super_admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Platform admin role — grants access to /admin routes. */
export const ADMIN_ROLE = "super_admin" as const satisfies UserRole;

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function isAdminRole(
  role: UserRole | string | null | undefined,
): role is typeof ADMIN_ROLE {
  return role === ADMIN_ROLE;
}

export function normalizeRole(
  role: UserRole | string | null | undefined,
): UserRole {
  return isUserRole(role ?? "") ? role : "customer";
}
