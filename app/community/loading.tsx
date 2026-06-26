export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-12 sm:px-6">
      <div className="mx-auto h-8 w-48 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-64 mx-auto animate-pulse rounded bg-white/10" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-16 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
