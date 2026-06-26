import { BrowsePageSkeleton } from "@/components/browse-skeletons";

export default function BrowseLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-64 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
        </div>
        <BrowsePageSkeleton />
      </main>
    </div>
  );
}
