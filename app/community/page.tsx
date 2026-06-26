import { Suspense } from "react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { CommunityFeed } from "@/components/community/community-feed";
import { FeedSkeleton } from "@/components/community/feed-skeleton";
import { getFeedPosts } from "@/lib/community/queries";
import type { FeedTab } from "@/lib/community/types";
import { createClient } from "@/lib/supabase/server";

type CommunityPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const { tab: tabParam } = await searchParams;
  const tab = (tabParam ?? "feed") as FeedTab;
  const validTab: FeedTab =
    tab === "following" || tab === "my-posts" ? tab : "feed";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const activeTab =
    !user && (validTab === "following" || validTab === "my-posts")
      ? "feed"
      : validTab;

  const posts = await getFeedPosts(activeTab, user?.id ?? null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AmbientBackground />
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
            Stocal
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Community Hub
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Connect with shoppers, brands, and sellers
          </p>
        </header>

        <Suspense fallback={<FeedSkeleton />}>
          <CommunityFeed
            initialPosts={posts}
            initialTab={activeTab}
            isAuthenticated={Boolean(user)}
            currentUserId={user?.id ?? null}
          />
        </Suspense>
      </main>
    </div>
  );
}
