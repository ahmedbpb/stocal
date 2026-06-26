import { createClient } from "@/lib/supabase/server";
import { browseTypeToProductType } from "@/lib/browse/product-type";
import type {
  BrowseFilters,
  BrowseSellerType,
  ProductCardData,
  SellerProfile,
} from "@/lib/browse/types";
import { resolveProductVariantSummary } from "@/lib/product-variants";
import {
  PRODUCT_STATUS_APPROVED,
  PRODUCT_STATUS_COLUMN,
} from "@/lib/products/status-column";

const PRODUCT_SELECT = `
  id, title, price, category, product_type, brand_name, image_urls,
  stock_quantity, sizes, colors, defect_declared,
  product_variants (color, size, stock_quantity)
`;

type ProductRow = Record<string, unknown> & {
  product_variants?: { color: string; size: string; stock_quantity: number }[] | null;
};

function mapProduct(row: ProductRow): ProductCardData {
  const summary = resolveProductVariantSummary(row.product_variants ?? [], {
    sizes: row.sizes as string[] | null,
    colors: row.colors as string[] | null,
    stock_quantity: row.stock_quantity as number | null,
  });

  return {
    id: String(row.id),
    title: String(row.title),
    price: Number(row.price),
    category: String(row.category),
    product_type: row.product_type as ProductCardData["product_type"],
    brand_name: (row.brand_name as string | null) ?? null,
    image_urls: (row.image_urls as string[] | null) ?? null,
    stock_quantity: summary.stockQuantity,
    sizes: summary.sizes.length > 0 ? summary.sizes : null,
    colors: summary.colors.length > 0 ? summary.colors : null,
    defect_declared: Boolean(row.defect_declared),
    has_variants: summary.hasVariants,
  };
}

export async function getSellerProfile(
  sellerId: string,
  role: BrowseSellerType,
): Promise<SellerProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, role")
    .eq("id", sellerId)
    .eq("role", role)
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to fetch seller profile:", error?.message);
    return null;
  }

  return data as SellerProfile;
}

export async function getSellerProducts(
  sellerId: string,
  productType: ProductCardData["product_type"],
): Promise<ProductCardData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("seller_id", sellerId)
    .eq("product_type", productType)
    .eq(PRODUCT_STATUS_COLUMN, PRODUCT_STATUS_APPROVED)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch seller products:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export async function browseProducts(
  filters: BrowseFilters,
): Promise<ProductCardData[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq(PRODUCT_STATUS_COLUMN, PRODUCT_STATUS_APPROVED)
    .order("created_at", { ascending: false });

  const productType = browseTypeToProductType(filters.type);
  if (productType) {
    query = query.eq("product_type", productType);
  }

  if (filters.category?.trim()) {
    query = query.eq("category", filters.category.trim());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to browse products:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export async function getDistinctCategories(
  type?: BrowseSellerType | null,
): Promise<string[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("category")
    .eq(PRODUCT_STATUS_COLUMN, PRODUCT_STATUS_APPROVED);

  const productType = browseTypeToProductType(type);
  if (productType) {
    query = query.eq("product_type", productType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch categories:", error.message);
    return [];
  }

  const unique = new Set<string>();
  for (const row of data ?? []) {
    if (row.category) unique.add(row.category);
  }

  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}
