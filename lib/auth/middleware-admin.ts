import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileForUser } from "@/lib/auth/profile";
import { canAccessAdminRoutes, unauthorizedHomeUrl } from "@/lib/auth/redirects";

const ADMIN_PREFIX = "/admin";

export function isAdminRoute(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

export async function enforceAdminRouteAccess(
  request: NextRequest,
  supabase: SupabaseClient,
): Promise<NextResponse | null> {
  if (!isAdminRoute(request.nextUrl.pathname)) {
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

  if (!canAccessAdminRoutes(profile?.role)) {
    return NextResponse.redirect(unauthorizedHomeUrl(request.nextUrl.origin));
  }

  return null;
}
