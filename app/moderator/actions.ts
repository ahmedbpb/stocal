"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { isModeratorRole } from "@/lib/auth/roles";

async function requireModeratorAuth() {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);
  if (!session || !isModeratorRole(session.profile.role)) {
    return { error: "Unauthorized.", supabase: null };
  }
  return { error: null, supabase };
}

export async function approvePost(postId: string): Promise<{ error?: string }> {
  const auth = await requireModeratorAuth();
  if (auth.error || !auth.supabase) return { error: auth.error };

  const { error } = await auth.supabase
    .from("posts")
    .update({ status: "approved", rejection_reason: null })
    .eq("id", postId);

  if (error) return { error: error.message };
  revalidatePath("/moderator");
  revalidatePath("/community");
  return {};
}

export async function rejectPost(
  postId: string,
  reason: string,
): Promise<{ error?: string }> {
  const auth = await requireModeratorAuth();
  if (auth.error || !auth.supabase) return { error: auth.error };

  const trimmed = reason.trim();
  if (!trimmed) return { error: "Rejection reason is required." };

  const { error } = await auth.supabase
    .from("posts")
    .update({ status: "rejected", rejection_reason: trimmed })
    .eq("id", postId);

  if (error) return { error: error.message };
  revalidatePath("/moderator");
  return {};
}

export async function deleteComment(commentId: string): Promise<{ error?: string }> {
  const auth = await requireModeratorAuth();
  if (auth.error || !auth.supabase) return { error: auth.error };

  const { error } = await auth.supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) return { error: error.message };
  revalidatePath("/moderator");
  revalidatePath("/community");
  return {};
}

export async function markReportReviewed(
  reportId: string,
): Promise<{ error?: string }> {
  const auth = await requireModeratorAuth();
  if (auth.error || !auth.supabase) return { error: auth.error };

  const { error } = await auth.supabase
    .from("reports")
    .update({ status: "reviewed" })
    .eq("id", reportId);

  if (error) return { error: error.message };
  revalidatePath("/moderator");
  return {};
}
