"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NewPostModal } from "@/components/community/new-post-modal";
import { PostCard } from "@/components/community/post-card";
import { FeedSkeleton } from "@/components/community/feed-skeleton";
import type { CommunityPost, FeedTab } from "@/lib/community/types";

const TABS: { id: FeedTab; label: string; authOnly?: boolean }[] = [
  { id: "feed", label: "Feed" },
  { id: "following", label: "Following", authOnly: true },
  { id: "my-posts", label: "My Posts", authOnly: true },
];

export function CommunityFeed({
  initialPosts,
  initialTab,
  isAuthenticated,
  currentUserId,
}: {
  initialPosts: CommunityPost[];
  initialTab: FeedTab;
  isAuthenticated: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<FeedTab>(initialTab);
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPosts(initialPosts);
    setTab(initialTab);
  }, [initialPosts, initialTab]);

  const loadTab = useCallback(
    async (nextTab: FeedTab) => {
      setLoading(true);
      const res = await fetch(`/api/community/feed?tab=${nextTab}`);
      const data = (await res.json()) as { posts: CommunityPost[] };
      setPosts(data.posts ?? []);
      setLoading(false);
    },
    [],
  );

  function switchTab(nextTab: FeedTab) {
    if (nextTab === tab) return;
    setTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "feed") params.delete("tab");
    else params.set("tab", nextTab);
    router.push(`/community${params.toString() ? `?${params}` : ""}`);
    loadTab(nextTab);
  }

  const emptyMessages: Record<FeedTab, string> = {
    feed: "No posts yet. Be the first to share!",
    following: "Follow members to see their posts here.",
    "my-posts": "You haven't posted yet. Share something with the community!",
  };

  return (
    <div className="relative">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {TABS.filter((t) => !t.authOnly || isAuthenticated).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            + New Post
          </button>
        )}
      </div>

      {!isAuthenticated && (
        <p className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-white/50">
          Sign in to post, react, comment, and follow members
        </p>
      )}

      {loading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
          <p className="text-white/50">{emptyMessages[tab]}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              showStatus={tab === "my-posts"}
            />
          ))}
        </div>
      )}

      {isAuthenticated && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black text-2xl text-white shadow-xl sm:hidden"
          aria-label="New post"
        >
          +
        </button>
      )}

      <NewPostModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
