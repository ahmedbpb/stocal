import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { enforceAdminRouteAccess } from "@/lib/auth/middleware-admin";
import { enforceModeratorRouteAccess } from "@/lib/auth/middleware-moderator";
import { enforceSellerRouteAccess } from "@/lib/auth/middleware-seller";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  const adminRedirect = await enforceAdminRouteAccess(request, supabase);
  if (adminRedirect) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      adminRedirect.cookies.set(cookie.name, cookie.value, cookie);
    });
    return adminRedirect;
  }

  const sellerRedirect = await enforceSellerRouteAccess(request, supabase);
  if (sellerRedirect) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      sellerRedirect.cookies.set(cookie.name, cookie.value, cookie);
    });
    return sellerRedirect;
  }

  const moderatorRedirect = await enforceModeratorRouteAccess(request, supabase);
  if (moderatorRedirect) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      moderatorRedirect.cookies.set(cookie.name, cookie.value, cookie);
    });
    return moderatorRedirect;
  }

  return supabaseResponse;
}
