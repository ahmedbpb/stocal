"use client";

import Image from "next/image";
import { getProfileInitials } from "@/lib/profile/display";

type ProfileAvatarProps = {
  name: string | null;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-3xl",
};

const IMAGE_SIZES = {
  sm: "32px",
  md: "40px",
  lg: "80px",
  xl: "112px",
};

export function ProfileAvatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: ProfileAvatarProps) {
  const initials = getProfileInitials(name);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-white/20 bg-black ${sizeClass} ${className}`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name?.trim() || "Profile"}
          fill
          className="object-cover"
          sizes={IMAGE_SIZES[size]}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-[#1a1a1a] text-xs font-medium text-white/80">
          {initials}
        </span>
      )}
    </div>
  );
}
