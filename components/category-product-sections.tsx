import { ProductGrid } from "@/components/product-grid";
import type { ProductCardData } from "@/lib/browse/types";

type CategoryProductSectionsProps = {
  sections: { category: string; products: ProductCardData[] }[];
  accent?: "local" | "stock" | "neutral";
};

export function CategoryProductSections({
  sections,
  accent = "neutral",
}: CategoryProductSectionsProps) {
  if (sections.length === 0) {
    return (
      <ProductGrid
        products={[]}
        accent={accent}
        emptyTitle="No products yet"
        emptyDescription="This seller hasn't listed any approved products."
      />
    );
  }

  return (
    <div className="space-y-10">
      {sections.map(({ category, products }) => (
        <section key={category}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            {category}
          </h2>
          <ProductGrid products={products} accent={accent} />
        </section>
      ))}
    </div>
  );
}
