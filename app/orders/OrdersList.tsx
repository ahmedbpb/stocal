import Link from "next/link";
import type { OrderStatus } from "@/lib/orders/status-styles";
import { statusBadgeClass } from "@/lib/orders/status-styles";

export type CustomerOrder = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  productTitle: string;
  productPrice: number;
  productImage: string | null;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrdersList({ orders }: { orders: CustomerOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-20 text-center backdrop-blur-md">
        <p className="text-lg font-medium text-white/60">No orders yet</p>
        <p className="mt-2 text-sm text-white/30">
          Browse local brands or original stocks and submit a purchase request
          to get started.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop/local"
            className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-fuchsia-500 hover:text-white"
          >
            Local Brands
          </Link>
          <Link
            href="/shop/stocks"
            className="inline-block rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-amber-500 hover:text-black"
          >
            Original Stocks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li
          key={order.id}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md transition-colors hover:border-white/15"
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] sm:h-20 sm:w-20">
              {order.productImage ? (
                <img
                  src={order.productImage}
                  alt={order.productTitle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white/20">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{order.productTitle}</p>
              <p className="mt-1 text-sm text-white/40">
                Ordered {formatDate(order.createdAt)}
              </p>
              <p className="mt-2 text-lg font-bold tracking-tight">
                ${order.productPrice.toFixed(2)}
              </p>
            </div>

            <div className="flex shrink-0 items-center sm:justify-end">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(order.status)}`}
              >
                {order.status}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
