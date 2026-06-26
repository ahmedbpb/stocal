"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { getAdminUsers, updateUserRole } from "./actions";
import { USER_ROLES, type AdminUser, type UserRole } from "./types";

type Toast = {
  message: string;
  type: "success" | "error";
};

const ROLE_STYLES: Record<UserRole, string> = {
  customer: "bg-white/10 text-white/60 ring-white/15",
  local_brand: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/25",
  stock_seller: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  moderator: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/25",
  super_admin: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
};

function formatRole(role: UserRole): string {
  return role.replace(/_/g, " ");
}

function ToastNotification({ toast }: { toast: Toast }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-2xl backdrop-blur-md ${
        toast.type === "success"
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
          : "border-red-500/30 bg-red-500/15 text-red-200"
      }`}
    >
      {toast.type === "success" ? (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
}

export default function UserManagementClient({
  initialUsers,
}: {
  initialUsers: AdminUser[];
}) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load users.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  async function handleRoleChange(userId: string, newRole: UserRole) {
    const user = users.find((u) => u.id === userId);
    if (!user || user.role === newRole) return;

    setUpdatingId(userId);

    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      showToast(
        `Role updated to "${formatRole(newRole)}" for ${user.email}`,
        "success",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update role.";
      showToast(message, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#080808] text-white">
      {toast && <ToastNotification toast={toast} />}

      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-white/[0.06] bg-[#0c0c0c]">
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-black">
            S
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">Stocal</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
              Super Admin
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/admin"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80"
          >
            <span className="text-xs opacity-60">◈</span>
            Overview
          </Link>
          <Link
            href="/admin/users"
            className="flex w-full items-center gap-3 rounded-xl bg-white/[0.08] px-3 py-2.5 text-sm text-white"
          >
            <span className="text-xs opacity-60">◇</span>
            User Management
            <span className="ml-auto rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
              {users.length}
            </span>
          </Link>
        </nav>

        <div className="space-y-2 border-t border-white/[0.06] p-4">
          <Link
            href="/"
            className="block rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center text-xs font-medium text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            View Storefront →
          </Link>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-xs text-white/40">Logged in as</p>
            <p className="mt-0.5 text-sm font-medium">Super Admin</p>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#080808]/80 px-8 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-semibold">User Management</h1>
            <p className="text-xs text-white/40">
              Assign roles and control platform access
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers()}
              className="text-xs text-white/30 hover:text-white/60"
            >
              Refresh
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-2 ring-white/10" />
          </div>
        </header>

        <div className="p-8">
          <div className="mb-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5 ring-1 ring-violet-500/20">
            <p className="text-sm font-medium text-violet-200">Role guide</p>
            <div className="mt-3 grid gap-2 text-xs text-white/50 sm:grid-cols-2">
              <p>
                <span className="text-white/70">customer</span> — browse & buy
              </p>
              <p>
                <span className="text-white/70">local_brand</span> — list brand
                products
              </p>
              <p>
                <span className="text-white/70">stock_seller</span> — list
                original stock
              </p>
              <p>
                <span className="text-white/70">moderator</span> — review
                community posts & reports
              </p>
              <p>
                <span className="text-white/70">super_admin</span> — full
                platform control
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/40">
                    <th className="px-6 py-4 font-medium">User Email</th>
                    <th className="px-6 py-4 font-medium">Current Role</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-16 text-center text-white/40"
                      >
                        Loading users…
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-16 text-center text-white/40"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{user.email}</p>
                          {user.full_name && (
                            <p className="mt-0.5 text-xs text-white/40">
                              {user.full_name}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${ROLE_STYLES[user.role]}`}
                          >
                            {formatRole(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            disabled={updatingId === user.id}
                            onChange={(e) =>
                              handleRoleChange(
                                user.id,
                                e.target.value as UserRole,
                              )
                            }
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/30 disabled:opacity-50"
                          >
                            {USER_ROLES.map((role) => (
                              <option
                                key={role}
                                value={role}
                                className="bg-[#1a1a1a]"
                              >
                                {role}
                              </option>
                            ))}
                          </select>
                          {updatingId === user.id && (
                            <span className="ml-2 text-xs text-white/40">
                              Updating…
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
