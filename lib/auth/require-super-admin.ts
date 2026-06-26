import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { canAccessAdminRoutes } from "@/lib/auth/redirects";
import { redirect } from "next/navigation";

export async function requireSuperAdmin() {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);

  if (!session) {
    redirect("/login?next=/admin");
  }

  if (!canAccessAdminRoutes(session.profile.role)) {
    redirect("/");
  }

  return {
    supabase,
    user: session.user,
    profile: session.profile,
  };
}

export async function assertSuperAdmin() {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);

  if (!session) {
    throw new Error("Unauthorized: authentication required");
  }

  if (!canAccessAdminRoutes(session.profile.role)) {
    throw new Error("Forbidden: super_admin role required");
  }

  return { supabase, user: session.user, profile: session.profile };
}
