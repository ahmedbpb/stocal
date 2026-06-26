import type { ProductVariantInput } from "@/lib/product-variants";

export type ProductStatus = "pending" | "approved" | "rejected";

export type StockCondition = "new" | "like_new" | "good" | "fair";

export type SellerProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  rejectionReason: string | null;
  imageUrl: string | null;
  condition: string | null;
  isIntact: boolean;
  defectDescription: string | null;
  defectImageUrl: string | null;
  description: string | null;
  imageUrls: string[];
  material: string | null;
  gender: string | null;
  sku: string | null;
  variants: ProductVariantInput[];
  createdAt: string;
};

export type SellerDashboardStats = {
  totalProducts: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalOrders: number;
  totalRevenue: number;
};

export type SellerOrder = {
  id: string;
  productTitle: string;
  size: string | null;
  color: string | null;
  price: number;
  status: string;
  createdAt: string;
};

export type SellerNavItem = {
  href: string;
  label: string;
  icon: string;
};
