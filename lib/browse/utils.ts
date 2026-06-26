import type { ProductCardData } from "@/lib/browse/types";

export function groupProductsByCategory(
  products: ProductCardData[],
): { category: string; products: ProductCardData[] }[] {
  const map = new Map<string, ProductCardData[]>();

  for (const product of products) {
    const list = map.get(product.category) ?? [];
    list.push(product);
    map.set(product.category, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({ category, products: items }));
}

export function getSellerDisplayName(
  profile: { full_name: string | null },
  fallback = "Seller",
): string {
  const name = profile.full_name?.trim();
  return name || fallback;
}
