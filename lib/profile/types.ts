import type { UserRole } from "@/lib/auth/roles";

export const MAX_BIO_LENGTH = 200;

export type ProfileData = {
  id: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
  email: string | null;
};
