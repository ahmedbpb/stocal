"use client";

import Link from "next/link";
import { useState } from "react";
import { toggleFollow } from "@/app/community/actions";
import { PostCard } from "@/components/community/post-card";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { RoleBadge } from "@/components/profile/role-badge";
import { getStorefrontPath } from "@/lib/profile/display";
import { isSellerRole } from "@/lib/auth/roles";
import type { CommunityPost, PublicProfile } from "@/lib/community/types";

export function PublicProfileView({
  profile,
  posts,
  isAuthenticated,
  currentUserId,
}: {
  profile: PublicProfile;
  posts: CommunityPost[];
  isAuthenticated: boolean;
  currentUserId: string | null;
}) {
  const [isFollowing, setIsFollowing] = useState(profile.isFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [loading, setLoading] = useState(false);

  const displayName = profile.fullName?.trim() || "Member";
  const storefrontPath = getStorefrontPath(profile.id, profile.role);

  async function handleFollow() {
    if (!isAuthenticated) return;
    setLoading(true);
    const prevFollowing = isFollowing;
    const prevCount = followerCount;
    setIsFollowing(!prevFollowing);
    setFollowerCount((c) => c + (prevFollowing ? -1 : 1));

    const result = await toggleFollow(profile.id);
    setLoading(false);

    if (result.error) {
      setIsFollowing(prevFollowing);
      setFollowerCount(prevCount);
    } else if (result.following !== undefined) {
      setIsFollowing(result.following);
    }
  }

  return (
    <div className="space-y-8">
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
            {profile.bio?.trim() ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm text-white/30">No bio yet.</p>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-6 sm:justify-start">
              <p className="text-sm text-white/60">
                <span className="font-semibold text-white">{followerCount}</span>{" "}
                followers
              </p>
              <p className="text-sm text-white/60">
                <span className="font-semibold text-white">
                  {profile.followingCount}
                </span>{" "}
                following
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
              {profile.isOwnProfile ? (
                <Link
                  href="/profile/edit"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.08]"
                >
                  Edit Profile
                </Link>
              ) : (
                isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={loading}
                    className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                      isFollowing
                        ? "border border-white/20 bg-transparent text-white/70 hover:bg-white/5"
                        : "bg-white text-black hover:bg-white/90"
                    }`}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )
              )}
              {isSellerRole(profile.role) && storefrontPath && (
                <Link
                  href={storefrontPath}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.08]"
                >
                  View Storefront
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/40">
          Community Posts
        </h2>
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
            <p className="text-white/50">No approved posts yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
