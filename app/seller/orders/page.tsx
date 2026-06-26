import { SellerOrdersTable } from "@/components/seller/seller-orders-table";
import { requireSeller } from "@/lib/auth/require-seller";
import { getSellerOrders } from "@/lib/seller/queries";

export default async function SellerOrdersPage() {
  const seller = await requireSeller();
  const orders = await getSellerOrders(seller.userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-white/40">
          Orders placed on your products — read only
        </p>
      </div>

      <SellerOrdersTable orders={orders} />
    </div>
  );
}
