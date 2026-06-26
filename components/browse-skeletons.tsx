export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
        >
          <div className="aspect-[4/5] animate-pulse bg-white/[0.06]" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StorefrontHeaderSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
      <div className="flex items-center gap-6">
        <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-white/10" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function BrowsePageSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <div className="hidden space-y-4 lg:block">
        <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-11 w-24 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
      </div>
      <ProductGridSkeleton />
    </div>
  );
}
