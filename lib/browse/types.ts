export type ProductType = "local_brand" | "original_stock";

/** URL browse filter values (maps to profiles.role / product_type). */
export type BrowseSellerType = "local_brand" | "stock_seller";

export type ProductCardData = {
  id: string;
  title: string;
  price: number;
  category: string;
  product_type: ProductType;
  brand_name: string | null;
  image_urls: string[] | null;
  stock_quantity: number;
  sizes: string[] | null;
  colors: string[] | null;
  defect_declared?: boolean;
  has_variants?: boolean;
};

export type SellerProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "local_brand" | "stock_seller";
};

export type BrowseFilters = {
  type?: BrowseSellerType | null;
  category?: string | null;
};
