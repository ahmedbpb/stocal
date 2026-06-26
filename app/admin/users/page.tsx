import { fetchAdminUsers } from "@/lib/admin/fetch-admin-users";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import UserManagementClient from "./UserManagementClient";

export default async function UserManagementPage() {
  const { supabase } = await requireSuperAdmin();
  const initialUsers = await fetchAdminUsers(supabase);

  return <UserManagementClient initialUsers={initialUsers} />;
}
