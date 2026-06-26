export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="h-3 w-full rounded bg-white/10" />
              <div className="h-3 w-2/3 rounded bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
