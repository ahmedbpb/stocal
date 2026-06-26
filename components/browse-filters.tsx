"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type BrowseFiltersProps = {
  categories: string[];
  currentType: string | null;
  currentCategory: string | null;
};

const TYPE_OPTIONS = [
  { value: "local_brand", label: "Local Brands" },
  { value: "stock_seller", label: "Original Stock" },
] as const;

export function BrowseFilters({
  categories,
  currentType,
  currentCategory,
}: BrowseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <aside className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          Seller Type
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateParams({ type: null })}
            className={`min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
              !currentType
                ? "border-white bg-white text-black"
                : "border-white/15 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            All
          </button>
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateParams({ type: option.value })}
              className={`min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                currentType === option.value
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          Category
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateParams({ category: null })}
            className={`min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
              !currentCategory
                ? "border-white bg-white text-black"
                : "border-white/15 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => updateParams({ category })}
              className={`min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                currentCategory === category
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {(currentType || currentCategory) && (
        <Link
          href="/browse"
          className="inline-flex min-h-11 items-center text-xs font-medium uppercase tracking-wider text-white/40 transition-colors hover:text-white/70"
        >
          Clear all filters
        </Link>
      )}
    </aside>
  );
}
