export { USER_ROLES, type UserRole, isUserRole } from "@/lib/auth/roles";

import type { UserRole } from "@/lib/auth/roles";

export type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
};
