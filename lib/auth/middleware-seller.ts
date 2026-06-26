import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileForUser } from "@/lib/auth/profile";
import { unauthorizedHomeUrl } from "@/lib/auth/redirects";

const SELLER_PREFIX = "/seller";

export function isSellerRoute(pathname: string): boolean {
  return pathname === SELLER_PREFIX || pathname.startsWith(`${SELLER_PREFIX}/`);
}

export function isSellerRole(
  role: string | null | undefined,
): role is "local_brand" | "stock_seller" {
  return role === "local_brand" || role === "stock_seller";
}

export async function enforceSellerRouteAccess(
  request: NextRequest,
  supabase: SupabaseClient,
): Promise<NextResponse | null> {
  if (!isSellerRoute(request.nextUrl.pathname)) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const profile = await getProfileForUser(supabase, user.id);

  if (!isSellerRole(profile?.role)) {
    return NextResponse.redirect(unauthorizedHomeUrl(request.nextUrl.origin));
  }

  return null;
}
