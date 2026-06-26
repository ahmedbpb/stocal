import { createClient } from "@/lib/supabase/server";
import { firstJoin } from "@/lib/supabase/first-join";
import {
  aggregateVariantSummary,
} from "@/lib/product-variants";
import type {
  SellerDashboardStats,
  SellerOrder,
  SellerProduct,
} from "@/lib/seller/types";

type VariantJoinRow = {
  id: string;
  color: string;
  size: string;
  stock_quantity: number;
};

type ProductRow = {
  id: string;
  title: string;
  category: string;
  price: number;
  stock_quantity: number | null;
  status: string;
  rejection_reason: string | null;
  image_urls: string[] | null;
  condition: string | null;
  is_intact: boolean | null;
  defect_description: string | null;
  defect_image_url: string | null;
  description: string | null;
  material: string | null;
  gender: string | null;
  sku: string | null;
  created_at: string;
  product_variants: VariantJoinRow[] | null;
};

const PRODUCT_SELECT = `
  id, title, category, price, stock_quantity, status, rejection_reason,
  image_urls, condition, is_intact, defect_description, defect_image_url,
  description, material, gender, sku, created_at,
  product_variants (id, color, size, stock_quantity)
`;

function mapProductRow(row: ProductRow): SellerProduct {
  const imageUrls = row.image_urls ?? [];
  const variants = (row.product_variants ?? []).map((v) => ({
    color: v.color,
    size: v.size,
    stockQuantity: Number(v.stock_quantity),
  }));
  const stockSummary = aggregateVariantSummary(
    variants.map((v) => ({
      color: v.color,
      size: v.size,
      stock_quantity: v.stockQuantity,
    })),
  );

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    price: Number(row.price),
    stockQuantity:
      stockSummary.hasVariants ? stockSummary.stockQuantity : Number(row.stock_quantity ?? 0),
    status: row.status as SellerProduct["status"],
    rejectionReason: row.rejection_reason,
    imageUrl: imageUrls[0] ?? null,
    condition: row.condition,
    isIntact: row.is_intact ?? true,
    defectDescription: row.defect_description,
    defectImageUrl: row.defect_image_url,
    description: row.description,
    imageUrls,
    material: row.material,
    gender: row.gender,
    sku: row.sku,
    variants,
    createdAt: row.created_at,
  };
}

export async function getSellerProducts(
  sellerId: string,
): Promise<SellerProduct[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSellerProducts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapProductRow(row as ProductRow));
}

export async function getSellerProduct(
  sellerId: string,
  productId: string,
): Promise<SellerProduct | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("seller_id", sellerId)
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProductRow(data as ProductRow);
}

export async function getSellerDashboardStats(
  sellerId: string,
): Promise<SellerDashboardStats> {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("status")
    .eq("seller_id", sellerId);

  const rows = products ?? [];
  const approvedCount = rows.filter((p) => p.status === "approved").length;
  const pendingCount = rows.filter((p) => p.status === "pending").length;
  const rejectedCount = rows.filter((p) => p.status === "rejected").length;

  const { data: sellerProducts } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", sellerId);

  const productIds = (sellerProducts ?? []).map((p) => p.id);

  if (productIds.length === 0) {
    return {
      totalProducts: rows.length,
      approvedCount,
      pendingCount,
      rejectedCount,
      totalOrders: 0,
      totalRevenue: 0,
    };
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, products(price)")
    .in("product_id", productIds);

  const orderRows = orders ?? [];
  const totalOrders = orderRows.length;
  const totalRevenue = orderRows.reduce((sum, order) => {
    if (order.status === "cancelled") return sum;
    const product = firstJoin(
      order.products as { price: number } | { price: number }[] | null,
    );
    return sum + Number(product?.price ?? 0);
  }, 0);

  return {
    totalProducts: rows.length,
    approvedCount,
    pendingCount,
    rejectedCount,
    totalOrders,
    totalRevenue,
  };
}

export async function getSellerOrders(sellerId: string): Promise<SellerOrder[]> {
  const supabase = await createClient();

  const { data: sellerProducts } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", sellerId);

  const productIds = (sellerProducts ?? []).map((p) => p.id);

  if (productIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, selected_size, selected_color, products(title, price)",
    )
    .in("product_id", productIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSellerOrders:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const product = firstJoin(
      row.products as
        | { title: string; price: number }
        | { title: string; price: number }[]
        | null,
    );

    return {
      id: row.id,
      productTitle: product?.title ?? "Unknown product",
      size: row.selected_size?.trim() || null,
      color: row.selected_color?.trim() || null,
      price: Number(product?.price ?? 0),
      status: row.status,
      createdAt: row.created_at,
    };
  });
}
