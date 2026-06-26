"use server";

import { revalidatePath } from "next/cache";
import { fetchAdminUsers } from "@/lib/admin/fetch-admin-users";
import { assertSuperAdmin } from "@/lib/auth/require-super-admin";
import {
  USER_ROLES,
  type AdminUser,
  type UserRole,
} from "@/app/admin/users/types";

function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { supabase } = await assertSuperAdmin();
  return fetchAdminUsers(supabase);
}

export async function updateUserRole(userId: string, role: UserRole) {
  if (!isUserRole(role)) {
    throw new Error("Invalid role");
  }

  const { supabase } = await assertSuperAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message || "Failed to update role");
  }

  revalidatePath("/admin/users");
}
