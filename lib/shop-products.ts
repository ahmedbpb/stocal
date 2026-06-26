import { createClient } from "@supabase/supabase-js";
import {
  PRODUCT_STATUS_APPROVED,
  PRODUCT_STATUS_COLUMN,
} from "@/lib/products/status-column";

export type ShopProduct = {
  id: string;
  title: string;
  price: number;
  category: string;
  product_type: "local_brand" | "original_stock";
  brand_name: string | null;
  image_urls: string[] | null;
  defect_declared: boolean;
  stock_quantity: number;
};

export type ShopProductType = ShopProduct["product_type"];

export async function getApprovedProducts(
  productType: ShopProductType,
): Promise<ShopProduct[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, price, category, product_type, brand_name, image_urls, defect_declared, stock_quantity",
    )
    .eq(PRODUCT_STATUS_COLUMN, PRODUCT_STATUS_APPROVED)
    .eq("product_type", productType)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch products:", error.message);
    return [];
  }

  return (data as ShopProduct[]) ?? [];
}
