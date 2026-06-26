import { isBrowseSellerType } from "@/lib/browse/product-type";

export function parseBrowseSearchParams(params: {
  type?: string;
  category?: string;
}) {
  const type = isBrowseSellerType(params.type) ? params.type : null;
  const category = params.category?.trim() || null;
  return { type, category };
}
