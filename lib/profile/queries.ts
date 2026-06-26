import { createClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/auth/roles";
import type { ProfileData } from "@/lib/profile/types";

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: string | null;
};

export async function getCurrentUserProfile(): Promise<ProfileData | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, role")
    .eq("id", user.id)
    .single<ProfileRow>();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    role: normalizeRole(data.role),
    email: user.email ?? null,
  };
}
