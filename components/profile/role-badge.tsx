import type { UserRole } from "@/lib/auth/roles";
import { getRoleBadgeClass, getRoleLabel } from "@/lib/profile/display";

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${getRoleBadgeClass(role)}`}
    >
      {getRoleLabel(role)}
    </span>
  );
}
