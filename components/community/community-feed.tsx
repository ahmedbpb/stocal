"use client";

import { useState } from "react";
import { NewPostModal } from "@/components/community/new-post-modal";
import { PostCard } from "@/components/community/post-card";
import type { CommunityPost } from "@/lib/community/types";

export function CommunityFeed({
  posts,
  isAuthenticated,
}: {
  posts: CommunityPost[];
  isAuthenticated: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="relative">
      {isAuthenticated && (
        <div className="mb-6 flex justify-end sm:justify-between sm:items-center">
          <p className="hidden text-sm text-white/40 sm:block">
            Share updates, finds, and style inspiration
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition-opacity hover:opacity-90"
          >
            + New Post
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <p className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-white/50">
          Sign in to post, react, and comment
        </p>
      )}

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
          <p className="text-white/50">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthenticated={isAuthenticated}
              onCommentsOpen={() => {}}
            />
          ))}
        </div>
      )}

      {isAuthenticated && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-2xl font-light text-white shadow-xl shadow-fuchsia-500/30 sm:hidden"
          aria-label="New post"
        >
          +
        </button>
      )}

      <NewPostModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
