import { isAdminRole, type UserRole } from "@/lib/auth/roles";

export const POST_LOGIN_PATH = "/";
export const UNAUTHORIZED_QUERY = "error";
export const UNAUTHORIZED_VALUE = "unauthorized";

export function getPostLoginPath(role?: UserRole | string | null): string {
  if (role === "super_admin" || role === "admin") {
    return "/admin";
  }
  if (role === "local_brand" || role === "stock_seller") {
    return "/seller/dashboard";
  }
  return POST_LOGIN_PATH;
}

export function getAccountPath(role: UserRole | null | undefined): string {
  switch (role) {
    case "super_admin":
      return "/admin";
    case "moderator":
      return "/moderator";
    case "local_brand":
    case "stock_seller":
      return "/seller/dashboard";
    default:
      return POST_LOGIN_PATH;
  }
}

export function getAccountLabel(role: UserRole | null | undefined): string {
  if (role === "super_admin") return "Admin";
  if (role === "moderator") return "Moderator";
  if (role === "local_brand" || role === "stock_seller") return "Dashboard";
  return "Account";
}

export function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export function canAccessAdminRoutes(
  role: UserRole | string | null | undefined,
): boolean {
  return isAdminRole(role) || role === "admin";
}

export function resolvePostLoginRedirect(
  role: UserRole | null | undefined,
  next: string | null,
): string {
  if (next && isSafeInternalPath(next)) {
    if (next.startsWith("/admin") && !canAccessAdminRoutes(role)) {
      return POST_LOGIN_PATH;
    }
    if (
      next.startsWith("/seller") &&
      role !== "local_brand" &&
      role !== "stock_seller"
    ) {
      return POST_LOGIN_PATH;
    }
    if (next.startsWith("/moderator") && role !== "moderator" && role !== "super_admin") {
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
