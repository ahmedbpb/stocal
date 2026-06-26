"use client";

import Link from "next/link";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

export function AuthorLink({
  userId,
  name,
  avatarUrl,
  size = "md",
  showName = true,
  className = "",
}: {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  size?: "sm" | "md";
  showName?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/profile/${userId}`}
      className={`inline-flex items-center gap-2 hover:opacity-80 ${className}`}
    >
      <ProfileAvatar name={name} avatarUrl={avatarUrl} size={size} />
      {showName && (
        <span className="text-sm font-medium text-white">
          {name?.trim() || "Member"}
        </span>
      )}
    </Link>
  );
}
