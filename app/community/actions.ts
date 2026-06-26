"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { getMentionHandle } from "@/lib/community/mentions";
import {
  createNotification,
  resolveMentionedUserIds,
} from "@/lib/community/notifications";
import {
  MAX_POST_LENGTH,
  type ReactionType,
  type ReportReason,
} from "@/lib/community/types";
import { uploadCommunityImage } from "@/lib/upload-community-image";

async function requireAuth() {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);
  if (!session) {
    return { error: "Please sign in.", supabase: null, userId: null, profile: null };
  }
  return {
    error: null,
    supabase,
    userId: session.user.id,
    profile: session.profile,
  };
}

async function getActorName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.full_name?.trim() || "Someone";
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
    .insert({ user_id: userId, content, status: "pending" })
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

export async function deletePost(
  postId: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const { error } = await auth.supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", auth.userId);

  if (error) return { error: error.message || "Failed to delete post." };

  revalidatePath("/community");
  revalidatePath("/profile");
  return { success: true };
}

export async function addComment(
  postId: string,
  content: string,
  parentId?: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const trimmed = content.trim();
  if (!trimmed) return { error: "Comment cannot be empty." };

  const { supabase, userId } = auth;
  let resolvedParentId: string | null = parentId ?? null;

  if (resolvedParentId) {
    const { data: parentComment } = await supabase
      .from("comments")
      .select("id, parent_id, post_id, user_id")
      .eq("id", resolvedParentId)
      .maybeSingle();

    if (!parentComment || parentComment.post_id !== postId) {
      return { error: "Invalid reply target." };
    }

    if (parentComment.parent_id) {
      resolvedParentId = parentComment.parent_id;
    }
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: userId,
      content: trimmed,
      status: "approved",
      parent_id: resolvedParentId,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message || "Failed to add comment." };
  }

  const actorName = await getActorName(supabase, userId);

  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();

  if (post && !resolvedParentId && post.user_id !== userId) {
    await createNotification(supabase, {
      userId: post.user_id,
      actorId: userId,
      type: "comment_on_post",
      entityType: "post",
      entityId: postId,
      message: `${actorName} commented on your post`,
    });
  }

  if (resolvedParentId) {
    const { data: parentComment } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", resolvedParentId)
      .maybeSingle();

    if (parentComment && parentComment.user_id !== userId) {
      await createNotification(supabase, {
        userId: parentComment.user_id,
        actorId: userId,
        type: "comment_reply",
        entityType: "comment",
        entityId: comment.id,
        message: `${actorName} replied to your comment`,
      });
    }
  }

  const mentionedIds = await resolveMentionedUserIds(supabase, trimmed);
  for (const mentionedId of mentionedIds) {
    await createNotification(supabase, {
      userId: mentionedId,
      actorId: userId,
      type: "comment_mentioned",
      entityType: "comment",
      entityId: comment.id,
      message: `${actorName} mentioned you in a comment`,
    });
  }

  revalidatePath("/community");
  return { success: true };
}

export async function deleteComment(
  commentId: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const { error } = await auth.supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", auth.userId);

  if (error) return { error: error.message || "Failed to delete comment." };

  revalidatePath("/community");
  return { success: true };
}

export async function toggleCommentLike(
  commentId: string,
): Promise<{ error?: string; liked?: boolean }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const { supabase, userId } = auth;

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message };
    return { liked: false };
  }

  const { error } = await supabase.from("comment_likes").insert({
    comment_id: commentId,
    user_id: userId,
  });

  if (error) return { error: error.message };
  return { liked: true };
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

  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();

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

  const { data: existing } = await supabase
    .from("reactions")
    .select("type")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase.from("reactions").upsert(
    { post_id: postId, user_id: userId, type },
    { onConflict: "post_id,user_id" },
  );

  if (error) {
    return { error: error.message || "Failed to save reaction." };
  }

  if (post && post.user_id !== userId && !existing) {
    const actorName = await getActorName(supabase, userId);
    await createNotification(supabase, {
      userId: post.user_id,
      actorId: userId,
      type: type === "like" ? "post_liked" : "post_disliked",
      entityType: "post",
      entityId: postId,
      message: `${actorName} ${type === "like" ? "liked" : "disliked"} your post`,
    });
  }

  revalidatePath("/community");
  return {};
}

export async function toggleFollow(
  userId: string,
): Promise<{ error?: string; following?: boolean }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  if (auth.userId === userId) {
    return { error: "You cannot follow yourself." };
  }

  const { supabase, userId: followerId } = auth;

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath(`/profile/${userId}`);
    revalidatePath("/community");
    return { following: false };
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: followerId,
    following_id: userId,
  });

  if (error) return { error: error.message };

  const actorName = await getActorName(supabase, followerId);
  await createNotification(supabase, {
    userId,
    actorId: followerId,
    type: "new_follower",
    entityType: "user",
    entityId: followerId,
    message: `${actorName} started following you`,
  });

  revalidatePath(`/profile/${userId}`);
  revalidatePath("/community");
  return { following: true };
}

export async function submitReport(
  targetType: "post" | "comment",
  targetId: string,
  reason: ReportReason,
  details: string,
): Promise<{ error?: string; success?: string }> {
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
  return { success: "Report submitted. Thank you." };
}

export async function fetchComments(
  postId: string,
): Promise<{
  comments: Awaited<ReturnType<typeof import("@/lib/community/queries").getPostComments>>;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { getPostComments, getFlaggedCommentIds } = await import(
    "@/lib/community/queries"
  );
  const flaggedIds = await getFlaggedCommentIds();
  const comments = await getPostComments(
    postId,
    flaggedIds,
    user?.id ?? null,
  );
  return { comments };
}

export async function fetchNotifications(): Promise<{
  notifications: Awaited<ReturnType<typeof import("@/lib/community/queries").getNotifications>>;
  error?: string;
}> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { notifications: [], error: auth.error ?? "Unauthorized." };
  }

  const { getNotifications } = await import("@/lib/community/queries");
  const notifications = await getNotifications(auth.userId);
  return { notifications };
}

export async function markNotificationsRead(
  notificationIds: string[],
): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  if (notificationIds.length === 0) return {};

  const { error } = await auth.supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", auth.userId)
    .in("id", notificationIds);

  if (error) return { error: error.message };
  return {};
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const { error } = await auth.supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", auth.userId)
    .eq("is_read", false);

  if (error) return { error: error.message };
  return {};
}

export async function getMentionPrefix(
  userId: string,
): Promise<{ handle: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  return { handle: getMentionHandle(data?.full_name ?? null) };
}
