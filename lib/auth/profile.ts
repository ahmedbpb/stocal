import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeRole, type UserRole } from "@/lib/auth/roles";

export type UserProfile = {
  id: string;
  role: UserRole;
  full_name: string | null;
};

type ProfileRow = {
  role: string | null;
  full_name: string | null;
};

export async function getProfileForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .single<ProfileRow>();

  if (error || !data) {
    return null;
  }

  return {
    id: userId,
    role: normalizeRole(data.role),
    full_name: data.full_name,
  };
}

export async function getAuthenticatedProfile(supabase: SupabaseClient): Promise<{
  user: User;
  profile: UserProfile;
} | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const profile = await getProfileForUser(supabase, user.id);

  return {
    user,
    profile: profile ?? {
      id: user.id,
      role: "customer",
      full_name: null,
    },
  };
}
