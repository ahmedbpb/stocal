import { notFound } from "next/navigation";
import { AmbientBackground } from "@/components/AmbientBackground";
import { PublicProfileView } from "@/components/profile/public-profile-view";
import { getPublicProfile, getUserApprovedPosts } from "@/lib/community/queries";
import { createClient } from "@/lib/supabase/server";

type PublicProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getPublicProfile(userId, user?.id ?? null);
  if (!profile) notFound();

  const posts = await getUserApprovedPosts(userId, user?.id ?? null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AmbientBackground />
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <PublicProfileView
          profile={profile}
          posts={posts}
          isAuthenticated={Boolean(user)}
          currentUserId={user?.id ?? null}
        />
      </main>
    </div>
  );
}
