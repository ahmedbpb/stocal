import { createClient } from "@/lib/supabase/server";
import { firstJoin } from "@/lib/supabase/first-join";
import { normalizeRole } from "@/lib/auth/roles";
import type {
  CommunityAuthor,
  CommunityComment,
  CommunityNotification,
  CommunityPost,
  FeedTab,
  NotificationType,
  PublicProfile,
  ReactionType,
} from "@/lib/community/types";

type ProfileJoin = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type ReactionRow = { type: string; user_id: string };
type CommentRow = { id: string; status: string; parent_id: string | null };
type CommentLikeRow = { user_id: string };

function mapAuthor(profile: ProfileJoin | null, fallbackId: string): CommunityAuthor {
  return {
    id: profile?.id ?? fallbackId,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
}

function mapPostRow(
  row: {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    user_id: string;
    status?: string;
    rejection_reason?: string | null;
    profiles: ProfileJoin | ProfileJoin[] | null;
    reactions: ReactionRow[] | null;
    comments: CommentRow[] | null;
  },
  currentUserId: string | null,
  options?: { reportCount?: number },
): CommunityPost {
  const profile = firstJoin(row.profiles);
  const reactions = row.reactions ?? [];
  const comments = (row.comments ?? []).filter((c) => c.status === "approved");

  let likeCount = 0;
  let dislikeCount = 0;
  let userReaction: ReactionType | null = null;

  for (const reaction of reactions) {
    if (reaction.type === "like") likeCount += 1;
    if (reaction.type === "dislike") dislikeCount += 1;
    if (currentUserId && reaction.user_id === currentUserId) {
      userReaction = reaction.type as ReactionType;
    }
  }

  return {
    id: row.id,
    content: row.content,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    author: mapAuthor(profile, row.user_id),
    likeCount,
    dislikeCount,
    commentCount: comments.length,
    userReaction,
    status: row.status as CommunityPost["status"],
    rejectionReason: row.rejection_reason ?? null,
    isOwn: currentUserId ? row.user_id === currentUserId : false,
    reportCount: options?.reportCount,
  };
}

const POST_SELECT = `
  id, content, image_url, created_at, user_id, status, rejection_reason,
  profiles (id, full_name, avatar_url),
  reactions (type, user_id),
  comments (id, status, parent_id)
`;

export async function getFeedPosts(
  tab: FeedTab,
  currentUserId: string | null,
): Promise<CommunityPost[]> {
  const supabase = await createClient();

  if (tab === "my-posts") {
    if (!currentUserId) return [];
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getFeedPosts my-posts:", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapPostRow(row, currentUserId));
  }

  if (tab === "following") {
    if (!currentUserId) return [];

    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    const followingIds = (followRows ?? []).map((r) => r.following_id);
    if (followingIds.length === 0) return [];

    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "approved")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getFeedPosts following:", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapPostRow(row, currentUserId));
  }

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getFeedPosts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapPostRow(row, currentUserId));
}

export async function getApprovedPosts(
  currentUserId: string | null,
): Promise<CommunityPost[]> {
  return getFeedPosts("feed", currentUserId);
}

export async function getUserApprovedPosts(
  userId: string,
  currentUserId: string | null,
): Promise<CommunityPost[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserApprovedPosts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapPostRow(row, currentUserId));
}

function buildCommentTree(
  rows: Array<{
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    parent_id: string | null;
    profiles: ProfileJoin | ProfileJoin[] | null;
    comment_likes: CommentLikeRow[] | null;
  }>,
  flaggedCommentIds: Set<string>,
  currentUserId: string | null,
): CommunityComment[] {
  const byId = new Map<string, CommunityComment>();
  const topLevel: CommunityComment[] = [];

  for (const row of rows) {
    const profile = firstJoin(row.profiles);
    const likes = row.comment_likes ?? [];
    const comment: CommunityComment = {
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      author: mapAuthor(profile, row.user_id),
      isFlagged: flaggedCommentIds.has(row.id),
      parentId: row.parent_id,
      likeCount: likes.length,
      userLiked: currentUserId
        ? likes.some((l) => l.user_id === currentUserId)
        : false,
      replies: [],
    };
    byId.set(row.id, comment);
  }

  for (const row of rows) {
    const comment = byId.get(row.id)!;
    if (!row.parent_id) {
      topLevel.push(comment);
      continue;
    }

    const parent = byId.get(row.parent_id);
    if (parent) {
      parent.replies.push(comment);
    } else {
      const rootParent = rows.find((r) => r.id === row.parent_id);
      if (rootParent?.parent_id) {
        const topParent = byId.get(rootParent.parent_id);
        topParent?.replies.push(comment);
      } else {
        topLevel.push(comment);
      }
    }
  }

  return topLevel;
}

export async function getPostComments(
  postId: string,
  flaggedCommentIds: Set<string>,
  currentUserId: string | null = null,
): Promise<CommunityComment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, content, created_at, user_id, parent_id, profiles(id, full_name, avatar_url), comment_likes(user_id)",
    )
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPostComments:", error.message);
    return [];
  }

  return buildCommentTree(data ?? [], flaggedCommentIds, currentUserId);
}

export async function getFlaggedCommentIds(): Promise<Set<string>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("reports")
    .select("target_id")
    .eq("target_type", "comment")
    .eq("status", "pending");

  return new Set((data ?? []).map((r) => r.target_id));
}

export async function getPublicProfile(
  userId: string,
  viewerId: string | null,
): Promise<PublicProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);

  let isFollowing = false;
  if (viewerId && viewerId !== userId) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", viewerId)
      .eq("following_id", userId)
      .maybeSingle();
    isFollowing = Boolean(followRow);
  }

  return {
    id: data.id,
    fullName: data.full_name,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    role: normalizeRole(data.role),
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
    isFollowing,
    isOwnProfile: viewerId === userId,
  };
}

export async function getNotifications(
  userId: string,
): Promise<CommunityNotification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, message, is_read, created_at, entity_type, entity_id, actor_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("getNotifications:", error.message);
    return [];
  }

  const actorIds = Array.from(new Set((data ?? []).map((r) => r.actor_id)));
  const { data: actors } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", actorIds)
    : { data: [] };

  const actorMap = new Map(
    (actors ?? []).map((a) => [a.id, a as ProfileJoin]),
  );

  return (data ?? []).map((row) => {
    const actorProfile = actorMap.get(row.actor_id) ?? null;
    return {
      id: row.id,
      type: row.type as NotificationType,
      message: row.message,
      isRead: row.is_read,
      createdAt: row.created_at,
      entityType: row.entity_type as CommunityNotification["entityType"],
      entityId: row.entity_id,
      actor: mapAuthor(actorProfile, row.actor_id),
    };
  });
}

export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}
