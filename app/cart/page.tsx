import { redirect } from "next/navigation";
import { AmbientBackground } from "@/components/AmbientBackground";
import { createClient } from "@/lib/supabase/server";
import { firstJoin } from "@/lib/supabase/first-join";
import type { CartItem } from "@/lib/cart/types";
import CartClient from "./CartClient";

export default async function CartPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      "id, quantity, selected_size, selected_color, products(id, title, price, image_urls, approval_status, stock_quantity)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch cart:", error.message);
  }

  const items: CartItem[] = (data ?? [])
    .map((row) => {
      const product = firstJoin(
        row.products as
          | {
              id: string;
              title: string;
              price: number;
              image_urls: string[] | null;
              approval_status: string;
              stock_quantity: number;
            }
          | {
              id: string;
              title: string;
              price: number;
              image_urls: string[] | null;
              approval_status: string;
              stock_quantity: number;
            }[]
          | null,
      );

      if (!product) return null;

      return {
        id: row.id,
        quantity: row.quantity,
        selectedSize: row.selected_size?.trim() || null,
        selectedColor: row.selected_color?.trim() || null,
        product: {
          id: product.id,
          title: product.title,
          price: Number(product.price),
          imageUrl: product.image_urls?.[0] ?? null,
          approvalStatus: product.approval_status,
          stockQuantity: Number(product.stock_quantity ?? 0),
        },
      };
    })
    .filter((item): item is CartItem => item !== null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AmbientBackground />
      <CartClient items={items} />
    </div>
  );
}
