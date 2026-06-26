import { AmbientBackground } from "@/components/AmbientBackground";

export default function PublicProfileLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AmbientBackground />
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="animate-pulse space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
            <div className="mx-auto h-28 w-28 rounded-full bg-white/10 sm:mx-0" />
            <div className="mt-6 h-6 w-48 rounded bg-white/10" />
            <div className="mt-4 h-4 w-full rounded bg-white/10" />
          </div>
        </div>
      </main>
    </div>
  );
}
