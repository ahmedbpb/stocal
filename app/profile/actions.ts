"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { MAX_BIO_LENGTH } from "@/lib/profile/types";
import { uploadAvatar } from "@/lib/upload-avatar";

export async function updateProfile(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);

  if (!session) {
    return { error: "Please sign in." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) {
    return { error: "Full name is required." };
  }

  const bio = String(formData.get("bio") ?? "").trim();
  if (bio.length > MAX_BIO_LENGTH) {
    return { error: `Bio must be at most ${MAX_BIO_LENGTH} characters.` };
  }

  const userId = session.user.id;
  let avatarUrl: string | undefined;

  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      avatarUrl = await uploadAvatar(supabase, avatarFile, userId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload avatar.";
      return { error: message };
    }
  }

  const updates: {
    full_name: string;
    bio: string | null;
    avatar_url?: string;
    updated_at: string;
  } = {
    full_name: fullName,
    bio: bio || null,
    updated_at: new Date().toISOString(),
  };

  if (avatarUrl) {
    updates.avatar_url = avatarUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    return { error: error.message || "Failed to update profile." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true };
}
