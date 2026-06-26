import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileForUser } from "@/lib/auth/profile";
import { isModeratorRole } from "@/lib/auth/roles";
import { unauthorizedHomeUrl } from "@/lib/auth/redirects";

const MODERATOR_PREFIX = "/moderator";

export function isModeratorRoute(pathname: string): boolean {
  return (
    pathname === MODERATOR_PREFIX || pathname.startsWith(`${MODERATOR_PREFIX}/`)
  );
}

export async function enforceModeratorRouteAccess(
  request: NextRequest,
  supabase: SupabaseClient,
): Promise<NextResponse | null> {
  if (!isModeratorRoute(request.nextUrl.pathname)) {
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

  if (!isModeratorRole(profile?.role)) {
    return NextResponse.redirect(unauthorizedHomeUrl(request.nextUrl.origin));
  }

  return null;
}
