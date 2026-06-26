"use client";

import { useState } from "react";
import { updateOrderStatus } from "./actions";
import { ORDER_STATUSES, type AdminOrder, type OrderStatus } from "./order-types";
import { statusBadgeClass } from "@/lib/orders/status-styles";
import { buildWhatsAppOrderConfirmationUrl } from "@/lib/whatsapp/order-confirmation";
import { formatPrice } from "@/lib/format-price";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function WhatsAppConfirmLink({ order }: { order: AdminOrder }) {
  const whatsappUrl = buildWhatsAppOrderConfirmationUrl(order);
  if (!whatsappUrl) return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Confirm via WhatsApp"
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-2.5 py-1.5 text-[11px] font-semibold text-[#25D366] ring-1 ring-[#25D366]/30 transition-colors hover:bg-[#25D366]/25"
    >
      <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
      Confirm via WhatsApp
    </a>
  );
}

export default function AdminOrdersTable({
  orders,
  loading,
  onRefresh,
  onError,
}: {
  orders: AdminOrder[];
  loading: boolean;
  onRefresh: () => void;
  onError: (message: string) => void;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    setUpdatingId(orderId);

    try {
      await updateOrderStatus(orderId, newStatus);
      onRefresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update status.";
      onError(message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold">Orders</h2>
          <p className="mt-1 text-sm text-white/40">
            Manage purchase requests and update order status
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
          {orders.filter((o) => o.status === "pending").length} pending
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/40">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Size</th>
                <th className="px-6 py-4 font-medium">Color</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Address</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-white/40"
                  >
                    Loading orders…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-white/40"
                  >
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {order.productTitle}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {order.selectedSize ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {order.selectedColor ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/60">
                      <div className="flex items-center gap-2">
                        <span>{order.customerPhone}</span>
                        <WhatsAppConfirmLink order={order} />
                      </div>
                    </td>
                    <td className="max-w-[220px] px-6 py-4 text-white/60">
                      <p className="line-clamp-2" title={order.customerAddress}>
                        {order.customerAddress}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatPrice(order.productPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus,
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide outline-none transition-colors focus:border-white/30 disabled:opacity-50 ${statusBadgeClass(order.status)}`}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option
                            key={status}
                            value={status}
                            className="bg-[#1a1a1a] text-white"
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                      {updatingId === order.id && (
                        <span className="ml-2 text-xs text-white/40">…</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white/40">
                      {order.submittedAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
