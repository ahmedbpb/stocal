"use client";

import { useState } from "react";
import Image from "next/image";
import {
  deletePost,
  setReaction,
  submitReport,
} from "@/app/community/actions";
import { AuthorLink } from "@/components/community/author-link";
import { CommentSection } from "@/components/community/comment-section";
import { ReportModal } from "@/components/community/report-modal";
import { formatRelativeTime } from "@/lib/community/format-time";
import type { CommunityPost, ReactionType } from "@/lib/community/types";

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  approved: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  rejected: "bg-red-500/15 text-red-300 ring-red-500/25",
};

export function PostCard({
  post,
  isAuthenticated,
  currentUserId,
  showStatus = false,
}: {
  post: CommunityPost;
  isAuthenticated: boolean;
  currentUserId: string | null;
  showStatus?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [userReaction, setUserReaction] = useState(post.userReaction);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [dislikeCount, setDislikeCount] = useState(post.dislikeCount);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reacting, setReacting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (removed) return null;

  async function handleReaction(type: ReactionType) {
    if (!isAuthenticated || reacting) return;
    setReacting(true);

    const next = userReaction === type ? null : type;
    const prevReaction = userReaction;
    const prevLikes = likeCount;
    const prevDislikes = dislikeCount;

    if (prevReaction === "like") setLikeCount((c) => c - 1);
    if (prevReaction === "dislike") setDislikeCount((c) => c - 1);
    if (next === "like") setLikeCount((c) => c + 1);
    if (next === "dislike") setDislikeCount((c) => c + 1);
    setUserReaction(next);

    const result = await setReaction(post.id, next);
    setReacting(false);

    if (result.error) {
      setUserReaction(prevReaction);
      setLikeCount(prevLikes);
      setDislikeCount(prevDislikes);
    }
  }

  async function handleReport(reason: string, details: string) {
    setReportLoading(true);
    const result = await submitReport(
      "post",
      post.id,
      reason as import("@/lib/community/types").ReportReason,
      details,
    );
    setReportLoading(false);
    if (result.success) {
      setReportSuccess(result.success);
      setTimeout(() => {
        setReportOpen(false);
        setReportSuccess(null);
      }, 1500);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(true);
    setRemoved(true);
    const result = await deletePost(post.id);
    setDeleting(false);
    if (result.error) {
      setRemoved(false);
      alert(result.error);
    }
  }

  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start gap-3">
        <AuthorLink
          userId={post.author.id}
          name={post.author.fullName}
          avatarUrl={post.author.avatarUrl}
          showName={false}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <AuthorLink
                userId={post.author.id}
                name={post.author.fullName}
                avatarUrl={post.author.avatarUrl}
              />
              <p className="mt-1 text-xs text-white/40">
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {showStatus && post.status && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${STATUS_STYLES[post.status]}`}
                >
                  {post.status}
                </span>
              )}
              {post.isOwn && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  aria-label="Delete post"
                  className="rounded-lg p-2 text-white/30 hover:text-red-400 disabled:opacity-50"
                >
                  🗑
                </button>
              )}
              {isAuthenticated && !post.isOwn && (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  aria-label="Report"
                  className="rounded-lg p-2 text-white/30 hover:text-red-400"
                >
                  🚩
                </button>
              )}
            </div>
          </div>

          {post.status === "rejected" && post.rejectionReason && (
            <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
              Rejected: {post.rejectionReason}
            </p>
          )}

          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
            {post.content}
          </p>

          {post.imageUrl && (
            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl border border-white/10">
              <Image
                src={post.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
          )}

          {post.status === "approved" && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!isAuthenticated || reacting}
                onClick={() => handleReaction("like")}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  userReaction === "like"
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
                }`}
              >
                👍 {likeCount}
              </button>
              <button
                type="button"
                disabled={!isAuthenticated || reacting}
                onClick={() => handleReaction("dislike")}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  userReaction === "dislike"
                    ? "border-red-500/40 bg-red-500/15 text-red-300"
                    : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
                }`}
              >
                👎 {dislikeCount}
              </button>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white"
              >
                💬 {post.commentCount} comments
              </button>
            </div>
          )}

          {expanded && post.status === "approved" && (
            <CommentSection
              postId={post.id}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>

      <ReportModal
        open={reportOpen}
        targetLabel="post"
        loading={reportLoading}
        successMessage={reportSuccess}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
      />
    </article>
  );
}
