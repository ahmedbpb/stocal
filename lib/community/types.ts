export const MAX_POST_LENGTH = 500;

export const REPORT_REASONS = [
  "Inappropriate language",
  "Spam",
  "Harassment",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReactionType = "like" | "dislike";

export type FeedTab = "feed" | "following" | "my-posts";

export type PostStatus = "pending" | "approved" | "rejected";

export type NotificationType =
  | "post_liked"
  | "post_disliked"
  | "post_approved"
  | "post_rejected"
  | "comment_on_post"
  | "comment_reply"
  | "comment_mentioned"
  | "new_follower"
  | "report_reviewed";

export type CommunityAuthor = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type CommunityPost = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: CommunityAuthor;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  userReaction: ReactionType | null;
  status?: PostStatus;
  rejectionReason?: string | null;
  isOwn?: boolean;
  reportCount?: number;
};

export type CommunityComment = {
  id: string;
  content: string;
  createdAt: string;
  author: CommunityAuthor;
  isFlagged: boolean;
  parentId: string | null;
  likeCount: number;
  userLiked: boolean;
  replies: CommunityComment[];
};

export type CommunityNotification = {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  entityType: "post" | "comment" | "user";
  entityId: string;
  actor: CommunityAuthor;
};

export type PublicProfile = {
  id: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: import("@/lib/auth/roles").UserRole;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
};
