"use server";

import { revalidatePath } from "next/cache";
import { assertSuperAdmin } from "@/lib/auth/require-super-admin";
import { parseStockQuantity } from "@/lib/inventory";

export async function updateProductStock(
  productId: string,
  stockQuantityRaw: string,
): Promise<{ error?: string }> {
  const stockQuantity = parseStockQuantity(stockQuantityRaw);
  if (stockQuantity === null) {
    return { error: "Enter a valid stock quantity (0 or greater)." };
  }

  try {
    const { supabase } = await assertSuperAdmin();

    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: stockQuantity })
      .eq("id", productId);

    if (error) {
      return { error: error.message || "Failed to update stock." };
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath("/shop/local");
    revalidatePath("/shop/stocks");
    revalidatePath(`/product/${productId}`);

    return {};
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update stock.";
    return { error: message };
  }
}
