export function SellerStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-8 w-16 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-3 w-32 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function SellerTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
      </div>
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-8 w-20 animate-pulse rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SellerFormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
          <div className="h-12 animate-pulse rounded-xl bg-white/10" />
        </div>
      ))}
      <div className="h-12 w-full animate-pulse rounded-xl bg-white/10" />
    </div>
  );
}

export function SellerPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-72 animate-pulse rounded bg-white/10" />
      </div>
      <SellerStatsSkeleton />
      <SellerTableSkeleton />
    </div>
  );
}
