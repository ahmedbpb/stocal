import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { AmbientBackground } from "@/components/AmbientBackground";
import ProductDetailsClient from "./ProductDetailsClient";
import type { ProductDetail } from "./types";

async function getProduct(id: string): Promise<ProductDetail | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, price, category, product_type, brand_name, description, defect_declared, defect_description, image_urls, condition, sizes, colors, stock_quantity, approval_status",
    )
    .eq("id", id)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    price: Number(data.price),
    category: data.category,
    product_type: data.product_type,
    brand_name: data.brand_name,
    description: data.description,
    defect_declared: data.defect_declared,
    defect_description: data.defect_description,
    image_urls: data.image_urls,
    condition: data.condition,
    sizes: data.sizes ?? [],
    colors: data.colors ?? [],
    stock_quantity: Number(data.stock_quantity ?? 0),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AmbientBackground />
      <ProductDetailsClient product={product} />
    </div>
  );
}
