import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { isModeratorRole } from "@/lib/auth/roles";

export async function requireModerator() {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);

  if (!session) {
    redirect("/login?next=/moderator");
  }

  if (!isModeratorRole(session.profile.role)) {
    redirect("/");
  }

  return session;
}
