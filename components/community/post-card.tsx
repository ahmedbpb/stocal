"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { addComment, fetchComments, setReaction, submitReport } from "@/app/community/actions";
import { ReportModal } from "@/components/community/report-modal";
import { formatRelativeTime } from "@/lib/community/format-time";
import type { CommunityComment, CommunityPost, ReactionType } from "@/lib/community/types";

function AuthorAvatar({
  name,
  avatarUrl,
}: {
  name: string | null;
  avatarUrl: string | null;
}) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill className="object-cover" sizes="40px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/70">
          {initial}
        </span>
      )}
    </div>
  );
}

function FlagButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Report"
      className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-red-400"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    </button>
  );
}

function CommentSection({
  postId,
  isAuthenticated,
}: {
  postId: string;
  isAuthenticated: boolean;
}) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<CommunityComment | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  async function loadComments() {
    if (loaded) return;
    setLoading(true);
    const result = await fetchComments(postId);
    setComments(result.comments);
    setLoaded(true);
    setLoading(false);
  }

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const result = await addComment(postId, text);
    setSubmitting(false);
    if (!result.error) {
      setText("");
      setLoaded(false);
      await loadComments();
    }
  }

  async function handleReport(reason: string, details: string) {
    if (!reportTarget) return;
    setReportLoading(true);
    await submitReport(
      "comment",
      reportTarget.id,
      reason as import("@/lib/community/types").ReportReason,
      details,
    );
    setReportLoading(false);
    setReportTarget(null);
  }

  return (
    <div className="border-t border-white/[0.06] pt-4">
      {loading ? (
        <p className="text-sm text-white/40">Loading comments…</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`flex gap-3 rounded-xl p-3 ${
                comment.isFlagged
                  ? "border border-orange-500/30 bg-orange-500/5"
                  : "bg-white/[0.02]"
              }`}
            >
              <AuthorAvatar
                name={comment.author.fullName}
                avatarUrl={comment.author.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">
                    {comment.author.fullName ?? "Member"}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-white/40">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    {isAuthenticated && (
                      <FlagButton onClick={() => setReportTarget(comment)} />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm text-white/70">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAuthenticated && (
        <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="shrink-0 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
          >
            Post
          </button>
        </form>
      )}

      <ReportModal
        open={reportTarget !== null}
        targetLabel="comment"
        loading={reportLoading}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReport}
      />
    </div>
  );
}

export function PostCard({
  post,
  isAuthenticated,
  onCommentsOpen,
}: {
  post: CommunityPost;
  isAuthenticated: boolean;
  onCommentsOpen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [userReaction, setUserReaction] = useState(post.userReaction);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [dislikeCount, setDislikeCount] = useState(post.dislikeCount);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reacting, setReacting] = useState(false);

  async function handleReaction(type: ReactionType) {
    if (!isAuthenticated || reacting) return;
    setReacting(true);

    const next =
      userReaction === type ? null : type;

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
    await submitReport(
      "post",
      post.id,
      reason as import("@/lib/community/types").ReportReason,
      details,
    );
    setReportLoading(false);
    setReportOpen(false);
  }

  function toggleComments() {
    const next = !expanded;
    setExpanded(next);
    if (next) onCommentsOpen();
  }

  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start gap-3">
        <AuthorAvatar
          name={post.author.fullName}
          avatarUrl={post.author.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-white">
                {post.author.fullName ?? "Member"}
              </p>
              <p className="text-xs text-white/40">
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
            {isAuthenticated && <FlagButton onClick={() => setReportOpen(true)} />}
          </div>
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
              onClick={toggleComments}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white"
            >
              💬 {post.commentCount} comments
            </button>
          </div>

          {expanded && (
            <CommentSection postId={post.id} isAuthenticated={isAuthenticated} />
          )}
        </div>
      </div>

      <ReportModal
        open={reportOpen}
        targetLabel="post"
        loading={reportLoading}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
      />
    </article>
  );
}
