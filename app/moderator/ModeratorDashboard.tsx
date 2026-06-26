"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { firstJoin } from "@/lib/supabase/first-join";
import { formatRelativeTime } from "@/lib/community/format-time";
import { RejectProductModal } from "@/app/admin/RejectProductModal";
import {
  approvePost,
  deleteComment,
  markReportReviewed,
  rejectPost,
  removeReportedComment,
  removeReportedPost,
} from "@/app/moderator/actions";

type ModStats = {
  pendingPosts: number;
  pendingReports: number;
  commentsToday: number;
  approvedPosts: number;
};

type PendingPost = {
  id: string;
  content: string;
  imageUrl: string | null;
  authorName: string;
  authorId: string;
  userJoinDate: string;
  reportCount: number;
  createdAt: string;
};

type ModComment = {
  id: string;
  content: string;
  authorName: string;
  postId: string;
  postPreview: string;
  createdAt: string;
  isFlagged: boolean;
};

type ModReport = {
  id: string;
  reporterName: string;
  targetType: "post" | "comment";
  targetId: string;
  targetContent: string;
  reason: string;
  details: string | null;
  createdAt: string;
};

type Toast = { message: string; type: "success" | "error" };

const TABS = ["Pending Posts", "Comments", "Reports"] as const;

function ToastNotification({ toast }: { toast: Toast }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-2xl backdrop-blur-md ${
        toast.type === "success"
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
          : "border-red-500/30 bg-red-500/15 text-red-200"
      }`}
    >
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
}

export default function ModeratorDashboard() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Pending Posts");
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [comments, setComments] = useState<ModComment[]>([]);
  const [reports, setReports] = useState<ModReport[]>([]);
  const [stats, setStats] = useState<ModStats>({
    pendingPosts: 0,
    pendingReports: 0,
    commentsToday: 0,
    approvedPosts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingPost | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      { count: pendingPostCount },
      { count: pendingReportCount },
      { count: commentsTodayCount },
      { count: approvedPostCount },
    ] = await Promise.all([
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfDay.toISOString()),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved"),
    ]);

    setStats({
      pendingPosts: pendingPostCount ?? 0,
      pendingReports: pendingReportCount ?? 0,
      commentsToday: commentsTodayCount ?? 0,
      approvedPosts: approvedPostCount ?? 0,
    });

    const { data: pendingData, error: pendingError } = await supabase
      .from("posts")
      .select("id, content, image_url, created_at, user_id, profiles(full_name, created_at)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (pendingError) {
      showToast("Failed to load pending posts.", "error");
    } else {
      setPendingPosts(
        await Promise.all(
          (pendingData ?? []).map(async (row) => {
            const profile = firstJoin(
              row.profiles as
                | { full_name: string | null; created_at: string }
                | { full_name: string | null; created_at: string }[]
                | null,
            );
            const { count } = await supabase
              .from("reports")
              .select("*", { count: "exact", head: true })
              .eq("target_type", "post")
              .eq("target_id", row.id)
              .eq("status", "pending");
            return {
              id: row.id,
              content: row.content,
              imageUrl: row.image_url,
              authorName: profile?.full_name ?? "Member",
              authorId: row.user_id,
              userJoinDate: profile?.created_at ?? row.created_at,
              reportCount: count ?? 0,
              createdAt: row.created_at,
            };
          }),
        ),
      );
    }

    const { data: reportsData } = await supabase
      .from("reports")
      .select("target_id, target_type, status")
      .eq("status", "pending");

    const flaggedCommentIds = new Set(
      (reportsData ?? [])
        .filter((r) => r.target_type === "comment")
        .map((r) => r.target_id),
    );

    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, content, created_at, post_id, profiles(full_name), posts(content)")
      .order("created_at", { ascending: false })
      .limit(100);

    setComments(
      (commentsData ?? []).map((row) => {
        const profile = firstJoin(
          row.profiles as
            | { full_name: string | null }
            | { full_name: string | null }[]
            | null,
        );
        const post = firstJoin(
          row.posts as
            | { content: string }
            | { content: string }[]
            | null,
        );
        return {
          id: row.id,
          content: row.content,
          authorName: profile?.full_name ?? "Member",
          postId: row.post_id,
          postPreview: post?.content?.slice(0, 60) ?? "Post",
          createdAt: row.created_at,
          isFlagged: flaggedCommentIds.has(row.id),
        };
      }),
    );

    const { data: pendingReports } = await supabase
      .from("reports")
      .select("id, target_type, target_id, reason, details, created_at, reporter_id")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const mappedReports: ModReport[] = [];
    for (const row of pendingReports ?? []) {
      const { data: reporterProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", row.reporter_id)
        .maybeSingle();

      let targetContent = row.target_id.slice(0, 8);

      if (row.target_type === "post") {
        const { data: post } = await supabase
          .from("posts")
          .select("content")
          .eq("id", row.target_id)
          .maybeSingle();
        targetContent = post?.content ?? targetContent;
      } else {
        const { data: comment } = await supabase
          .from("comments")
          .select("content")
          .eq("id", row.target_id)
          .maybeSingle();
        targetContent = comment?.content ?? targetContent;
      }

      mappedReports.push({
        id: row.id,
        reporterName: reporterProfile?.full_name ?? "User",
        targetType: row.target_type as "post" | "comment",
        targetId: row.target_id,
        targetContent,
        reason: row.reason,
        details: row.details,
        createdAt: row.created_at,
      });
    }

    setReports(mappedReports);
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleApprove(postId: string) {
    setActionId(postId);
    const result = await approvePost(postId);
    setActionId(null);
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast("Post approved.", "success");
  }

  async function handleReject(postId: string, reason: string) {
    setActionId(postId);
    const result = await rejectPost(postId, reason);
    setActionId(null);
    setRejectTarget(null);
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast("Post rejected.", "success");
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    setActionId(commentId);
    const result = await deleteComment(commentId);
    setActionId(null);
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    showToast("Comment deleted.", "success");
  }

  async function handleDismissReport(reportId: string) {
    setActionId(reportId);
    const result = await markReportReviewed(reportId);
    setActionId(null);
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    showToast("Report dismissed.", "success");
  }

  async function handleRemoveReported(report: ModReport) {
    if (!confirm("Remove reported content and dismiss report?")) return;
    setActionId(report.id);
    const result =
      report.targetType === "post"
        ? await removeReportedPost(report.id, report.targetId)
        : await removeReportedComment(report.id, report.targetId);
    setActionId(null);
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    showToast("Content removed.", "success");
    fetchData();
  }

  const statCards = [
    { label: "Pending posts", value: stats.pendingPosts },
    { label: "Pending reports", value: stats.pendingReports },
    { label: "Comments today", value: stats.commentsToday },
    { label: "Approved posts", value: stats.approvedPosts },
  ];

  return (
    <div className="flex min-h-screen bg-[#080808] text-white">
      {toast && <ToastNotification toast={toast} />}

      <RejectProductModal
        open={rejectTarget !== null}
        productTitle={rejectTarget?.content.slice(0, 40) ?? ""}
        loading={actionId === rejectTarget?.id}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) handleReject(rejectTarget.id, reason);
        }}
      />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0c0c0c] md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 text-xs font-black">
            M
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">Moderator</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
              Community Hub
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                activeTab === tab
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
              }`}
            >
              {tab}
              {tab === "Pending Posts" && pendingPosts.length > 0 && (
                <span className="ml-auto rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                  {pendingPosts.length}
                </span>
              )}
              {tab === "Reports" && reports.length > 0 && (
                <span className="ml-auto rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-300">
                  {reports.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/[0.06] p-4">
          <Link
            href="/community"
            className="block rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center text-xs font-medium text-white/60 hover:bg-white/[0.08] hover:text-white"
          >
            View Community →
          </Link>
        </div>
      </aside>

      <main className="ml-0 flex-1 md:ml-64">
        <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#080808]/80 px-4 py-4 backdrop-blur-md sm:px-8">
          <div className="flex gap-2 overflow-x-auto md:hidden">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                  activeTab === tab ? "bg-white/10 text-white" : "text-white/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <h1 className="mt-2 text-lg font-semibold md:mt-0">{activeTab}</h1>
        </header>

        <div className="p-4 sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <p className="text-xs uppercase tracking-wider text-white/40">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <p className="text-white/40">Loading…</p>
          ) : activeTab === "Pending Posts" ? (
            pendingPosts.length === 0 ? (
              <p className="text-white/40">No pending posts.</p>
            ) : (
              <div className="space-y-4">
                {pendingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
                  >
                    <div className="flex flex-wrap gap-4">
                      {post.imageUrl && (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10">
                          <Image
                            src={post.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/50">
                          <Link
                            href={`/profile/${post.authorId}`}
                            className="text-white/70 hover:underline"
                          >
                            {post.authorName}
                          </Link>
                          {" · "}
                          Joined {formatRelativeTime(post.userJoinDate)}
                          {" · "}
                          {formatRelativeTime(post.createdAt)}
                        </p>
                        {post.reportCount > 0 && (
                          <p className="mt-1 text-xs text-orange-300">
                            {post.reportCount} pending report
                            {post.reportCount === 1 ? "" : "s"}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-white/80">{post.content}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(post.id)}
                        disabled={actionId === post.id}
                        className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectTarget(post)}
                        disabled={actionId === post.id}
                        className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/25 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "Comments" ? (
            comments.length === 0 ? (
              <p className="text-white/40">No comments yet.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-xl border p-4 ${
                      comment.isFlagged
                        ? "border-orange-500/30 bg-orange-500/5"
                        : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    <p className="text-xs text-white/40">
                      {comment.authorName} · {formatRelativeTime(comment.createdAt)}
                      {comment.isFlagged && (
                        <span className="ml-2 text-orange-300">Reported</span>
                      )}
                    </p>
                    <Link
                      href="/community"
                      className="mt-1 block text-xs text-cyan-400 hover:underline"
                    >
                      On post: {comment.postPreview}…
                    </Link>
                    <p className="mt-2 text-sm text-white/80">{comment.content}</p>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={actionId === comment.id}
                      className="mt-3 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : reports.length === 0 ? (
            <p className="text-white/40">No pending reports.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/40">
                    <th className="px-4 py-3">Reporter</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-4 py-3">{report.reporterName}</td>
                      <td className="px-4 py-3 capitalize">{report.targetType}</td>
                      <td className="max-w-xs px-4 py-3 text-white/70">
                        {report.targetContent}
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {report.reason}
                        {report.details && (
                          <p className="mt-1 text-xs text-white/40">{report.details}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveReported(report)}
                            disabled={actionId === report.id}
                            className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30 disabled:opacity-50"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissReport(report.id)}
                            disabled={actionId === report.id}
                            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15 disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
