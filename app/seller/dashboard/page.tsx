import Link from "next/link";
import { formatPrice } from "@/lib/format-price";
import { requireSeller } from "@/lib/auth/require-seller";
import { getSellerDashboardStats } from "@/lib/seller/queries";

export default async function SellerDashboardPage() {
  const seller = await requireSeller();
  const stats = await getSellerDashboardStats(seller.userId);

  const cards = [
    {
      label: "Total products",
      value: String(stats.totalProducts),
      detail: `${stats.approvedCount} approved · ${stats.pendingCount} pending · ${stats.rejectedCount} rejected`,
      accent: "from-violet-500/20 to-violet-500/5",
      ring: "ring-violet-500/20",
    },
    {
      label: "Total orders",
      value: String(stats.totalOrders),
      detail: "Orders for your listings",
      accent: "from-cyan-500/20 to-cyan-500/5",
      ring: "ring-cyan-500/20",
    },
    {
      label: "Revenue",
      value: formatPrice(stats.totalRevenue),
      detail: "From non-cancelled orders",
      accent: "from-emerald-500/20 to-emerald-500/5",
      ring: "ring-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">
          Overview of your products and sales
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border border-white/[0.06] bg-gradient-to-br ${card.accent} p-5 ring-1 ${card.ring}`}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-white/40">{card.detail}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="text-base font-semibold">Quick actions</h2>
        <p className="mt-1 text-sm text-white/40">
          Manage your storefront in a few clicks
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/seller/products/new"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Upload product
          </Link>
          <Link
            href="/seller/orders"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.08]"
          >
            View orders
          </Link>
          <Link
            href="/seller/products"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.08]"
          >
            Manage products
          </Link>
        </div>
      </section>
    </div>
  );
}
