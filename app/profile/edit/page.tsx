import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { requireAuth } from "@/lib/auth/require-auth";
import { getCurrentUserProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";

export default async function EditProfilePage() {
  await requireAuth("/profile/edit");
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login?next=/profile/edit");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AmbientBackground />
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <Link
            href="/profile"
            className="text-sm text-white/40 transition-colors hover:text-white/70"
          >
            ← Back to profile
          </Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Edit Profile</h1>
          <p className="mt-2 text-sm text-white/40">
            Update your name, bio, and profile photo
          </p>
        </header>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
          <EditProfileForm profile={profile} />
        </div>
      </main>
    </div>
  );
}
