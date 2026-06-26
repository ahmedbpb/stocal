import Link from "next/link";

type ShopByCategoryProps = {
  categories: string[];
};

export function ShopByCategory({ categories }: ShopByCategoryProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/10 bg-[#111111] px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-white">
          Shop by Category
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/browse?category=${encodeURIComponent(category)}`}
              className="inline-flex min-h-10 items-center border border-white/20 px-5 py-2 text-sm text-white/70 transition-colors hover:bg-white hover:text-black"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
