import { formatPrice } from "@/lib/format-price";
import {
  statusBadgeClass,
  type OrderStatus,
} from "@/lib/orders/status-styles";
import type { SellerOrder } from "@/lib/seller/types";

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateStr));
}

export function SellerOrdersTable({ orders }: { orders: SellerOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <p className="text-white/50">No orders yet for your products.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/40">
              <th className="px-4 py-4 font-medium sm:px-6">Product</th>
              <th className="px-4 py-4 font-medium sm:px-6">Customer</th>
              <th className="px-4 py-4 font-medium sm:px-6">Size</th>
              <th className="px-4 py-4 font-medium sm:px-6">Color</th>
              <th className="px-4 py-4 font-medium sm:px-6">Price</th>
              <th className="px-4 py-4 font-medium sm:px-6">Status</th>
              <th className="px-4 py-4 font-medium sm:px-6">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-4 font-medium text-white sm:px-6">
                  {order.productTitle}
                </td>
                <td className="px-4 py-4 text-white/60 sm:px-6">Customer</td>
                <td className="px-4 py-4 text-white/60 sm:px-6">
                  {order.size ?? "—"}
                </td>
                <td className="px-4 py-4 text-white/60 sm:px-6">
                  {order.color ?? "—"}
                </td>
                <td className="px-4 py-4 font-medium sm:px-6">
                  {formatPrice(order.price)}
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusBadgeClass(order.status as OrderStatus)}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-white/40 sm:px-6">
                  {formatDate(order.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
