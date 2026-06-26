import { createClient } from "@/lib/supabase/server";
import { firstJoin } from "@/lib/supabase/first-join";
import type {
  CommunityAuthor,
  CommunityComment,
  CommunityPost,
  ReactionType,
} from "@/lib/community/types";

type ProfileJoin = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type ReactionRow = { type: string; user_id: string };
type CommentRow = { id: string; status: string };

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
    profiles: ProfileJoin | ProfileJoin[] | null;
    reactions: ReactionRow[] | null;
    comments: CommentRow[] | null;
  },
  currentUserId: string | null,
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
  };
}

const POST_SELECT = `
  id, content, image_url, created_at, user_id,
  profiles (id, full_name, avatar_url),
  reactions (type, user_id),
  comments (id, status)
`;

export async function getApprovedPosts(
  currentUserId: string | null,
): Promise<CommunityPost[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getApprovedPosts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapPostRow(row, currentUserId));
}

export async function getPostComments(
  postId: string,
  flaggedCommentIds: Set<string>,
): Promise<CommunityComment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, content, created_at, user_id, profiles(id, full_name, avatar_url)",
    )
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPostComments:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const profile = firstJoin(
      row.profiles as ProfileJoin | ProfileJoin[] | null,
    );
    return {
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      author: mapAuthor(profile, row.user_id),
      isFlagged: flaggedCommentIds.has(row.id),
    };
  });
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
