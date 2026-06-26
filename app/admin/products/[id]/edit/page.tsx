import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import EditProductClient from "./EditProductClient";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const { data, error } = await supabase
    .from("products")
    .select("id, title, product_type, category, price, stock_quantity, approval_status")
    .eq("id", id)
    .maybeSingle();

  if (error || !data || data.approval_status !== "approved") {
    notFound();
  }

  return (
    <EditProductClient
      product={{
        id: data.id,
        title: data.title,
        productType: data.product_type,
        category: data.category,
        price: Number(data.price),
        stockQuantity: Number(data.stock_quantity ?? 0),
      }}
    />
  );
}
