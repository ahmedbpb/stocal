export type ProductDetail = {
  id: string;
  title: string;
  price: number;
  category: string;
  product_type: "local_brand" | "original_stock";
  brand_name: string | null;
  description: string | null;
  defect_declared: boolean;
  defect_description: string | null;
  image_urls: string[] | null;
  condition: string | null;
  sizes: string[];
  colors: string[];
  stock_quantity: number;
};
