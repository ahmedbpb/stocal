"use client";

import { useEffect, useState } from "react";
import {
  addComment,
  deleteComment,
  fetchComments,
  submitReport,
  toggleCommentLike,
} from "@/app/community/actions";
import { AuthorLink } from "@/components/community/author-link";
import { MentionText } from "@/components/community/mention-text";
import { ReportModal } from "@/components/community/report-modal";
import { formatRelativeTime } from "@/lib/community/format-time";
import { getMentionHandle } from "@/lib/community/mentions";
import type { CommunityComment } from "@/lib/community/types";

function FlagButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Report"
      className="rounded p-1 text-white/30 hover:text-red-400"
    >
      🚩
    </button>
  );
}

function CommentItem({
  comment,
  isAuthenticated,
  currentUserId,
  onReply,
  depth,
}: {
  comment: CommunityComment;
  isAuthenticated: boolean;
  currentUserId: string | null;
  onReply: (comment: CommunityComment) => void;
  depth: 0 | 1;
}) {
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [userLiked, setUserLiked] = useState(comment.userLiked);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const isOwn = currentUserId === comment.author.id;

  if (removed) return null;

  async function handleLike() {
    if (!isAuthenticated) return;
    const prevLiked = userLiked;
    const prevCount = likeCount;
    setUserLiked(!prevLiked);
    setLikeCount((c) => c + (prevLiked ? -1 : 1));
    const result = await toggleCommentLike(comment.id);
    if (result.error) {
      setUserLiked(prevLiked);
      setLikeCount(prevCount);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    setDeleting(true);
    const result = await deleteComment(comment.id);
    setDeleting(false);
    if (!result.error) setRemoved(true);
  }

  async function handleReport(reason: string, details: string) {
    setReportLoading(true);
    const result = await submitReport(
      "comment",
      comment.id,
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

  return (
    <div className={depth === 1 ? "ml-8 border-l border-white/10 pl-4" : ""}>
      <div
        className={`rounded-xl p-3 ${
          comment.isFlagged
            ? "border border-orange-500/30 bg-orange-500/5"
            : "bg-white/[0.02]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <AuthorLink
            userId={comment.author.id}
            name={comment.author.fullName}
            avatarUrl={comment.author.avatarUrl}
            size="sm"
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/40">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {isAuthenticated && <FlagButton onClick={() => setReportOpen(true)} />}
          </div>
        </div>

        <p className="mt-2 text-sm text-white/70">
          <MentionText content={comment.content} />
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            disabled={!isAuthenticated}
            onClick={handleLike}
            className={`${userLiked ? "text-emerald-300" : "text-white/50"} hover:text-white`}
          >
            👍 {likeCount}
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="text-white/50 hover:text-white"
            >
              Reply
            </button>
          )}
          {isOwn && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-400/70 hover:text-red-300"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {comment.replies.map((reply) => (
        <div key={reply.id} className="mt-2">
          <CommentItem
            comment={reply}
            isAuthenticated={isAuthenticated}
            currentUserId={currentUserId}
            onReply={onReply}
            depth={1}
          />
        </div>
      ))}

      <ReportModal
        open={reportOpen}
        targetLabel="comment"
        loading={reportLoading}
        successMessage={reportSuccess}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
      />
    </div>
  );
}

export function CommentSection({
  postId,
  isAuthenticated,
  currentUserId,
}: {
  postId: string;
  isAuthenticated: boolean;
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState<CommunityComment | null>(null);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);

  async function loadComments() {
    setLoading(true);
    const result = await fetchComments(postId);
    setComments(result.comments);
    setLoading(false);
  }

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  function startReply(comment: CommunityComment) {
    const rootId = comment.parentId ?? comment.id;
    setReplyTarget(comment);
    setReplyParentId(rootId);
    const handle = getMentionHandle(comment.author.fullName);
    setText(`@${handle} `);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const result = await addComment(postId, text, replyParentId);
    setSubmitting(false);
    if (!result.error) {
      setText("");
      setReplyTarget(null);
      setReplyParentId(null);
      await loadComments();
    }
  }

  return (
    <div className="border-t border-white/[0.06] pt-4">
      {loading ? (
        <p className="text-sm text-white/40">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-white/40">No comments yet. Start the conversation.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              onReply={startReply}
              depth={0}
            />
          ))}
        </div>
      )}

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
          {replyTarget && (
            <p className="text-xs text-white/40">
              Replying to {replyTarget.author.fullName ?? "member"}
              <button
                type="button"
                onClick={() => {
                  setReplyTarget(null);
                  setReplyParentId(null);
                  setText("");
                }}
                className="ml-2 text-white/60 hover:text-white"
              >
                Cancel
              </button>
            </p>
          )}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={replyTarget ? "Write a reply…" : "Write a comment…"}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="shrink-0 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
