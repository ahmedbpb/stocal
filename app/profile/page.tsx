import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";
import { ProfileView } from "@/components/profile/profile-view";
import { requireAuth } from "@/lib/auth/require-auth";
import { getCurrentUserProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  await requireAuth("/profile");
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login?next=/profile");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AmbientBackground />
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">My Profile</h1>
        </header>

        <ProfileView profile={profile} />
      </main>
    </div>
  );
}
