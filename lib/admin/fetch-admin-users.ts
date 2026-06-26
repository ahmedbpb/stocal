import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminUser, UserRole } from "@/app/admin/users/types";

export async function fetchAdminUsers(
  supabase: SupabaseClient,
): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("get_admin_users");

  if (!error && data) {
    return data as AdminUser[];
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .order("created_at", { ascending: false });

  if (profileError) {
    throw new Error(
      profileError.message || "Failed to fetch users from profiles",
    );
  }

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    email: profile.full_name ?? `${profile.id.slice(0, 8)}…`,
    role: profile.role as UserRole,
    full_name: profile.full_name,
  }));
}
