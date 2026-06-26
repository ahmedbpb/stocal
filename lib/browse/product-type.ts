import type { BrowseSellerType, ProductType } from "@/lib/browse/types";

export function browseTypeToProductType(
  type: BrowseSellerType | string | null | undefined,
): ProductType | null {
  if (type === "local_brand") return "local_brand";
  if (type === "stock_seller") return "original_stock";
  return null;
}

export function productTypeToBrowseType(
  productType: ProductType,
): BrowseSellerType {
  return productType === "local_brand" ? "local_brand" : "stock_seller";
}

export function isBrowseSellerType(
  value: string | null | undefined,
): value is BrowseSellerType {
  return value === "local_brand" || value === "stock_seller";
}

export function sellerRoleToProductType(
  role: "local_brand" | "stock_seller",
): ProductType {
  return role === "local_brand" ? "local_brand" : "original_stock";
}
