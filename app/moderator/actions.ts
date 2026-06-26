"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { isModeratorRole } from "@/lib/auth/roles";
import { createNotification } from "@/lib/community/notifications";

async function requireModeratorAuth() {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);
  if (!session || !isModeratorRole(session.profile.role)) {
    return { error: "Unauthorized.", supabase: null, actorId: null };
  }
  return { error: null, supabase, actorId: session.user.id };
}

export async function approvePost(postId: string): Promise<{ error?: string }> {
  const auth = await requireModeratorAuth();
  if (auth.error || !auth.supabase) return { error: auth.error };

  const { data: post } = await auth.supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();

  const { error } = await auth.supabase
    .from("posts")
    .update({ status: "approved", rejection_reason: null })
    .eq("id", postId);

  if (error) return { error: error.message };

  if (post && auth.actorId) {
    await createNotification(auth.supabase, {
      userId: post.user_id,
      actorId: auth.actorId,
      type: "post_approved",
      entityType: "post",
      entityId: postId,
      message: "Your post was approved and is now live",
    });
  }

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

  const { data: post } = await auth.supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();

  const { error } = await auth.supabase
    .from("posts")
    .update({ status: "rejected", rejection_reason: trimmed })
    .eq("id", postId);

  if (error) return { error: error.message };

  if (post && auth.actorId) {
    await createNotification(auth.supabase, {
      userId: post.user_id,
      actorId: auth.actorId,
      type: "post_rejected",
      entityType: "post",
      entityId: postId,
      message: `Your post was rejected: ${trimmed}`,
    });
  }

  revalidatePath("/moderator");
  revalidatePath("/community");
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

  const { data: report } = await auth.supabase
    .from("reports")
    .select("reporter_id, target_type, target_id")
    .eq("id", reportId)
    .maybeSingle();

  const { error } = await auth.supabase
    .from("reports")
    .update({ status: "reviewed" })
    .eq("id", reportId);

  if (error) return { error: error.message };

  if (report && auth.actorId) {
    await createNotification(auth.supabase, {
      userId: report.reporter_id,
      actorId: auth.actorId,
      type: "report_reviewed",
      entityType: report.target_type as "post" | "comment",
      entityId: report.target_id,
      message: "Your report has been reviewed by a moderator",
    });
  }

  revalidatePath("/moderator");
  return {};
}

export async function removeReportedPost(
  reportId: string,
  postId: string,
): Promise<{ error?: string }> {
  const auth = await requireModeratorAuth();
  if (auth.error || !auth.supabase) return { error: auth.error };

  const { error: deleteError } = await auth.supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (deleteError) return { error: deleteError.message };

  await auth.supabase
    .from("reports")
    .update({ status: "reviewed" })
    .eq("id", reportId);

  revalidatePath("/moderator");
  revalidatePath("/community");
  return {};
}

export async function removeReportedComment(
  reportId: string,
  commentId: string,
): Promise<{ error?: string }> {
  const auth = await requireModeratorAuth();
  if (auth.error || !auth.supabase) return { error: auth.error };

  const { error: deleteError } = await auth.supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (deleteError) return { error: deleteError.message };

  await auth.supabase
    .from("reports")
    .update({ status: "reviewed" })
    .eq("id", reportId);

  revalidatePath("/moderator");
  revalidatePath("/community");
  return {};
}
