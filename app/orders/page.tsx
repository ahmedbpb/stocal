import { redirect } from "next/navigation";
import { AmbientBackground } from "@/components/AmbientBackground";
import { createClient } from "@/lib/supabase/server";
import { firstJoin } from "@/lib/supabase/first-join";
import type { OrderStatus } from "@/lib/orders/status-styles";
import OrdersList, { type CustomerOrder } from "./OrdersList";

export default async function MyOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, created_at, products(title, price, image_urls)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch orders:", error.message);
  }

  const orders: CustomerOrder[] = (data ?? []).map((row) => {
    const product = firstJoin(
      row.products as
        | {
            title: string;
            price: number;
            image_urls: string[] | null;
          }
        | {
            title: string;
            price: number;
            image_urls: string[] | null;
          }[]
        | null,
    );

    return {
      id: row.id,
      status: row.status as OrderStatus,
      createdAt: row.created_at,
      productTitle: product?.title ?? "Unknown product",
      productPrice: Number(product?.price ?? 0),
      productImage: product?.image_urls?.[0] ?? null,
    };
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AmbientBackground />

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <h1
            className="text-3xl font-black tracking-tight sm:text-4xl"
            style={{
              background:
                "linear-gradient(180deg, #ffffff 0%, #ffffff 50%, rgba(255,255,255,0.4) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            My Orders
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Track your purchase requests and order status
          </p>
        </header>

        <OrdersList orders={orders} />
      </main>
    </div>
  );
}
