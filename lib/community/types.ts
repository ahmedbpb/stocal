export const MAX_POST_LENGTH = 500;

export const REPORT_REASONS = [
  "Inappropriate language",
  "Spam",
  "Harassment",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReactionType = "like" | "dislike";

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
};

export type CommunityComment = {
  id: string;
  content: string;
  createdAt: string;
  author: CommunityAuthor;
  isFlagged: boolean;
};
