import { AmbientBackground } from "@/components/AmbientBackground";
import { CommunityFeed } from "@/components/community/community-feed";
import { getApprovedPosts } from "@/lib/community/queries";
import { createClient } from "@/lib/supabase/server";

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const posts = await getApprovedPosts(user?.id ?? null);

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

        <CommunityFeed posts={posts} isAuthenticated={Boolean(user)} />
      </main>
    </div>
  );
}
