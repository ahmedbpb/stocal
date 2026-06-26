import { isAdminRole, type UserRole } from "@/lib/auth/roles";

export const POST_LOGIN_PATH = "/";
export const UNAUTHORIZED_QUERY = "error";
export const UNAUTHORIZED_VALUE = "unauthorized";

export function getPostLoginPath(_role?: UserRole | null): string {
  return POST_LOGIN_PATH;
}

export function getAccountPath(role: UserRole | null | undefined): string {
  switch (role) {
    case "super_admin":
      return "/admin";
    case "local_brand":
      return "/add-product/local-brand";
    case "stock_seller":
      return "/add-product/original-stock";
    default:
      return POST_LOGIN_PATH;
  }
}

export function getAccountLabel(role: UserRole | null | undefined): string {
  return role === "super_admin" ? "Admin" : "Account";
}

export function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export function canAccessAdminRoutes(
  role: UserRole | string | null | undefined,
): boolean {
  return isAdminRole(role);
}

export function resolvePostLoginRedirect(
  role: UserRole | null | undefined,
  next: string | null,
): string {
  if (next && isSafeInternalPath(next)) {
    if (next.startsWith("/admin") && !canAccessAdminRoutes(role)) {
      return POST_LOGIN_PATH;
    }
    return next;
  }

  return getPostLoginPath(role);
}

export function unauthorizedHomeUrl(origin: string): URL {
  const url = new URL(POST_LOGIN_PATH, origin);
  url.searchParams.set(UNAUTHORIZED_QUERY, UNAUTHORIZED_VALUE);
  return url;
}
