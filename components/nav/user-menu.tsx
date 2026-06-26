"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { getAccountLabel, getAccountPath } from "@/lib/auth/redirects";
import type { UserRole } from "@/lib/auth/roles";

type UserMenuProps = {
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  onLogout: () => void;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

const menuLinkClass =
  "block px-4 py-2.5 text-sm text-white/70 transition-colors hover:text-white";

export function UserMenu({
  fullName,
  avatarUrl,
  role,
  onLogout,
  onNavigate,
  variant = "desktop",
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = fullName?.trim() || "Account";
  const accountHref = getAccountPath(role);
  const accountLabel = getAccountLabel(role);
  const showDashboardLink = accountHref !== "/profile" && accountHref !== "/";

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  if (variant === "mobile") {
    return (
      <div className="mt-2 space-y-0 border-t border-white/10 pt-3">
        <div className="flex items-center gap-3 px-4 py-3">
          <ProfileAvatar name={fullName} avatarUrl={avatarUrl} size="sm" />
          <p className="truncate text-sm text-white">{displayName}</p>
        </div>
        <Link
          href="/profile"
          onClick={() => {
            close();
            onNavigate?.();
          }}
          className={`${menuLinkClass} px-4`}
        >
          My Profile
        </Link>
        {showDashboardLink && (
          <Link
            href={accountHref}
            onClick={() => {
              close();
              onNavigate?.();
            }}
            className={`${menuLinkClass} px-4`}
          >
            {accountLabel}
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            close();
            onLogout();
          }}
          className={`${menuLinkClass} w-full px-4 text-left`}
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-11 items-center gap-2.5 text-sm text-white transition-opacity hover:opacity-80"
      >
        <ProfileAvatar name={fullName} avatarUrl={avatarUrl} size="sm" />
        <span className="hidden max-w-[9rem] truncate lg:inline">{displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 border border-white/10 bg-black py-1"
        >
          <Link href="/profile" role="menuitem" onClick={close} className={menuLinkClass}>
            My Profile
          </Link>
          {showDashboardLink && (
            <Link
              href={accountHref}
              role="menuitem"
              onClick={close}
              className={menuLinkClass}
            >
              {accountLabel}
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onLogout();
            }}
            className={`${menuLinkClass} w-full text-left`}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
