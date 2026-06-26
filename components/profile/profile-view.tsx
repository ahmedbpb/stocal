"use client";

import Link from "next/link";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { RoleBadge } from "@/components/profile/role-badge";
import { isSellerRole } from "@/lib/auth/roles";
import { getStorefrontPath } from "@/lib/profile/display";
import type { ProfileData } from "@/lib/profile/types";

export function ProfileView({ profile }: { profile: ProfileData }) {
  const displayName = profile.fullName?.trim() || "Member";
  const storefrontPath = getStorefrontPath(profile.id, profile.role);
  const isSeller = isSellerRole(profile.role);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <ProfileAvatar
            name={profile.fullName}
            avatarUrl={profile.avatarUrl}
            size="xl"
          />
          <div className="min-w-0 flex-1">
            <RoleBadge role={profile.role} />
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {displayName}
            </h1>
            {profile.email && (
              <p className="mt-1 text-sm text-white/40">{profile.email}</p>
            )}
            {profile.bio?.trim() ? (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-4 text-sm text-white/30">No bio yet.</p>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Link
                href="/profile/edit"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                Edit Profile
              </Link>
              {isSeller && storefrontPath && (
                <Link
                  href={storefrontPath}
                  className="rounded-xl bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  View Storefront
                </Link>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
