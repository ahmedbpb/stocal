"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { MAX_POST_LENGTH, type ReactionType, type ReportReason } from "@/lib/community/types";
import { uploadCommunityImage } from "@/lib/upload-community-image";

async function requireAuth() {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);
  if (!session) {
    return { error: "Please sign in.", supabase: null, userId: null };
  }
  return { error: null, supabase, userId: session.user.id };
}

export async function createPost(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "Post content is required." };
  if (content.length > MAX_POST_LENGTH) {
    return { error: `Post must be at most ${MAX_POST_LENGTH} characters.` };
  }

  const imageFile = formData.get("image");
  const { supabase, userId } = auth;

  const { data: post, error: insertError } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      content,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message || "Failed to create post." };
  }

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      const imageUrl = await uploadCommunityImage(supabase, imageFile, userId);
      await supabase
        .from("posts")
        .update({ image_url: imageUrl })
        .eq("id", post.id);
    } catch (err) {
      await supabase.from("posts").delete().eq("id", post.id);
      const message =
        err instanceof Error ? err.message : "Failed to upload image.";
      return { error: message };
    }
  }

  revalidatePath("/community");
  return { success: "Your post is pending moderator approval." };
}

export async function addComment(
  postId: string,
  content: string,
): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const trimmed = content.trim();
  if (!trimmed) return { error: "Comment cannot be empty." };

  const { error } = await auth.supabase.from("comments").insert({
    post_id: postId,
    user_id: auth.userId,
    content: trimmed,
    status: "approved",
  });

  if (error) {
    return { error: error.message || "Failed to add comment." };
  }

  revalidatePath("/community");
  return {};
}

export async function setReaction(
  postId: string,
  type: ReactionType | null,
): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const { supabase, userId } = auth;

  if (type === null) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    revalidatePath("/community");
    return {};
  }

  const { error } = await supabase.from("reactions").upsert(
    {
      post_id: postId,
      user_id: userId,
      type,
    },
    { onConflict: "post_id,user_id" },
  );

  if (error) {
    return { error: error.message || "Failed to save reaction." };
  }

  revalidatePath("/community");
  return {};
}

export async function submitReport(
  targetType: "post" | "comment",
  targetId: string,
  reason: ReportReason,
  details: string,
): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const { error } = await auth.supabase.from("reports").insert({
    reporter_id: auth.userId,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details.trim() || null,
    status: "pending",
  });

  if (error) {
    return { error: error.message || "Failed to submit report." };
  }

  revalidatePath("/community");
  revalidatePath("/moderator");
  return {};
}

export async function fetchComments(
  postId: string,
): Promise<{ comments: Awaited<ReturnType<typeof import("@/lib/community/queries").getPostComments>>; error?: string }> {
  const { getPostComments, getFlaggedCommentIds } = await import(
    "@/lib/community/queries"
  );
  const flaggedIds = await getFlaggedCommentIds();
  const comments = await getPostComments(postId, flaggedIds);
  return { comments };
}
