"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { firstJoin } from "@/lib/supabase/first-join";
import AdminOrdersTable from "./AdminOrdersTable";
import { RejectProductModal } from "./RejectProductModal";
import type { AdminOrder, OrderStatus } from "./order-types";
import { formatPrice } from "@/lib/format-price";
import { formatConditionLabel } from "@/lib/seller/product-helpers";

type ProductType = "local_brand" | "original_stock";

type PendingVariant = {
  color: string;
  size: string;
  stockQuantity: number;
};

type PendingProduct = {
  id: string;
  title: string;
  brand: string;
  type: ProductType;
  category: string;
  price: number;
  stockQuantity: number;
  description: string | null;
  material: string | null;
  gender: string | null;
  sku: string | null;
  variants: PendingVariant[];
  condition: string | null;
  isIntact: boolean;
  defectDescription: string | null;
  defectImageUrl: string | null;
  imageUrl: string | null;
  submittedAt: string;
};

type Toast = {
  message: string;
  type: "success" | "error";
};

const NAV_ITEMS = [
  { label: "Overview", icon: "◈" },
  { label: "Pending Approvals", icon: "◎" },
  { label: "Hub Logistics", icon: "⬡" },
  { label: "Payouts", icon: "◆" },
] as const;

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ToastNotification({ toast }: { toast: Toast }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-2xl backdrop-blur-md ${
        toast.type === "success"
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
          : "border-red-500/30 bg-red-500/15 text-red-200"
      }`}
    >
      {toast.type === "success" ? (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingProduct | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    const { data: pendingData, error: pendingError } = await supabase
      .from("products")
      .select(
        "id, title, brand_name, product_type, category, price, stock_quantity, description, material, gender, sku, condition, is_intact, defect_description, defect_image_url, image_urls, created_at, product_variants(color, size, stock_quantity)",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (pendingError) {
      showToast("Failed to load pending products.", "error");
      setLoading(false);
      return;
    }

    const mapped: PendingProduct[] = (pendingData ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      brand:
        row.product_type === "local_brand"
          ? row.brand_name ?? "Local Brand"
          : "Original Stock",
      type: row.product_type as ProductType,
      category: row.category,
      price: Number(row.price),
      stockQuantity: Number(row.stock_quantity ?? 0),
      description: row.description,
      material: row.material,
      gender: row.gender,
      sku: row.sku,
      variants: (row.product_variants ?? []).map(
        (v: { color: string; size: string; stock_quantity: number }) => ({
          color: v.color,
          size: v.size,
          stockQuantity: Number(v.stock_quantity),
        }),
      ),
      condition: row.condition,
      isIntact: row.is_intact ?? true,
      defectDescription: row.defect_description,
      defectImageUrl: row.defect_image_url,
      imageUrl: row.image_urls?.[0] ?? null,
      submittedAt: formatRelativeTime(row.created_at),
    }));

    setProducts(mapped);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, status, created_at, phone, address, selected_size, selected_color, products(title, price), profiles(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(20);

    const { count: pendingCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    setPendingOrderCount(pendingCount ?? 0);

    if (!orderError && orderData) {
      const mappedOrders: AdminOrder[] = orderData.map((row) => {
        const product = firstJoin(
          row.products as { title: string; price: number } | { title: string; price: number }[] | null,
        );
        const profile = firstJoin(
          row.profiles as { full_name: string | null } | { full_name: string | null }[] | null,
        );

        return {
          id: row.id,
          status: row.status as OrderStatus,
          productTitle: product?.title ?? "Unknown product",
          productPrice: Number(product?.price ?? 0),
          customerName: profile?.full_name ?? "Customer",
          customerPhone: row.phone?.trim() || "—",
          customerAddress: row.address?.trim() || "—",
          selectedSize: row.selected_size?.trim() || null,
          selectedColor: row.selected_color?.trim() || null,
          submittedAt: formatRelativeTime(row.created_at),
        };
      });
      setOrders(mappedOrders);
    } else {
      setOrders([]);
    }

    const { data: revenueData } = await supabase
      .from("orders")
      .select("product_id, products(price)")
      .eq("status", "shipped");

    const revenue = (revenueData ?? []).reduce((sum, order) => {
      const product = firstJoin(
        order.products as { price: number } | { price: number }[] | null,
      );
      return sum + Number(product?.price ?? 0);
    }, 0);

    setTotalRevenue(revenue);
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  async function handleApprove(id: string) {
    setActionId(id);

    const { error } = await supabase
      .from("products")
      .update({ status: "approved", rejection_reason: null })
      .eq("id", id);

    setActionId(null);

    if (error) {
      showToast("Failed to approve product.", "error");
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast("Product approved — now live on the shop.", "success");
  }

  async function handleReject(id: string, reason: string) {
    setActionId(id);

    const { error } = await supabase
      .from("products")
      .update({ status: "rejected", rejection_reason: reason })
      .eq("id", id);

    setActionId(null);
    setRejectTarget(null);

    if (error) {
      showToast("Failed to reject product.", "error");
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast("Product rejected.", "success");
  }

  const stats = [
    {
      label: "Pending Approvals",
      value: String(products.length),
      change: loading ? "Loading…" : `${products.length} awaiting review`,
      accent: "from-violet-500/20 to-violet-500/5",
      ring: "ring-violet-500/20",
      dot: "bg-violet-400",
    },
    {
      label: "Pending Orders",
      value: String(pendingOrderCount),
      change: "Awaiting confirmation",
      accent: "from-cyan-500/20 to-cyan-500/5",
      ring: "ring-cyan-500/20",
      dot: "bg-cyan-400",
    },
    {
      label: "Total Revenue",
      value: formatPrice(totalRevenue),
      change: "From shipped orders",
      accent: "from-emerald-500/20 to-emerald-500/5",
      ring: "ring-emerald-500/20",
      dot: "bg-emerald-400",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#080808] text-white">
      {toast && <ToastNotification toast={toast} />}
      <RejectProductModal
        open={rejectTarget !== null}
        productTitle={rejectTarget?.title ?? ""}
        loading={actionId === rejectTarget?.id}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) {
            handleReject(rejectTarget.id, reason);
          }
        }}
      />

      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-white/[0.06] bg-[#0c0c0c]">
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-black">
            S
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">Stocal</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
              Super Admin
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                activeNav === item.label
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
              }`}
            >
              <span className="text-xs opacity-60">{item.icon}</span>
              {item.label}
              {item.label === "Pending Approvals" && (
                <span className="ml-auto rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                  {products.length}
                </span>
              )}
            </button>
          ))}
          <Link
            href="/admin/users"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80"
          >
            <span className="text-xs opacity-60">◇</span>
            User Management
          </Link>
          <Link
            href="/admin/products"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80"
          >
            <span className="text-xs opacity-60">▣</span>
            Product Inventory
          </Link>
        </nav>

        <div className="space-y-2 border-t border-white/[0.06] p-4">
          <Link
            href="/"
            className="block rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center text-xs font-medium text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            View Storefront →
          </Link>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-xs text-white/40">Logged in as</p>
            <p className="mt-0.5 text-sm font-medium">Super Admin</p>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#080808]/80 px-8 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-semibold">Overview</h1>
            <p className="text-xs text-white/40">
              Monitor approvals, hub activity, and revenue
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData()}
              className="text-xs text-white/30 hover:text-white/60"
            >
              Refresh
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-2 ring-white/10" />
          </div>
        </header>

        <div className="p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border border-white/[0.06] bg-gradient-to-br ${stat.accent} p-5 ring-1 ${stat.ring}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${stat.dot}`} />
                  <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                    {stat.label}
                  </p>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-white/40">{stat.change}</p>
              </div>
            ))}
          </div>

          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Pending Product Approvals
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  Review local brand drops and original stock listings
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                {products.length} items pending
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/40">
                      <th className="px-6 py-4 font-medium">Product</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Category</th>
                      <th className="px-6 py-4 font-medium">Price</th>
                      <th className="px-6 py-4 font-medium">Stock</th>
                      <th className="px-6 py-4 font-medium">Details</th>
                      <th className="px-6 py-4 font-medium">Submitted</th>
                      <th className="px-6 py-4 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-16 text-center text-white/40"
                        >
                          Loading pending products…
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-16 text-center text-white/40"
                        >
                          All caught up — no pending approvals.
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr
                          key={product.id}
                          className="transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">
                              {product.title}
                            </p>
                            <p className="mt-0.5 text-xs text-white/40">
                              {product.brand} · {product.id.slice(0, 8)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                product.type === "local_brand"
                                  ? "bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/25"
                                  : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25"
                              }`}
                            >
                              {product.type === "local_brand"
                                ? "Local Brand"
                                : "Original Stock"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white/60">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {formatPrice(product.price)}
                          </td>
                          <td className="px-6 py-4 text-white/60">
                            {product.stockQuantity}
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-sm space-y-2 text-xs text-white/60">
                              {product.description && (
                                <p className="line-clamp-2">{product.description}</p>
                              )}
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {product.gender && (
                                  <span>Gender: {product.gender}</span>
                                )}
                                {product.material && (
                                  <span>Material: {product.material}</span>
                                )}
                                {product.sku && <span>SKU: {product.sku}</span>}
                              </div>
                              {product.variants.length > 0 && (
                                <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                                  <table className="w-full min-w-[220px] text-left">
                                    <thead>
                                      <tr className="border-b border-white/[0.06] text-[10px] uppercase text-white/40">
                                        <th className="px-2 py-1">Color</th>
                                        <th className="px-2 py-1">Size</th>
                                        <th className="px-2 py-1">Stock</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {product.variants.map((variant, i) => (
                                        <tr key={`${variant.color}-${variant.size}-${i}`}>
                                          <td className="px-2 py-1 text-white/80">
                                            {variant.color}
                                          </td>
                                          <td className="px-2 py-1">{variant.size}</td>
                                          <td className="px-2 py-1">
                                            {variant.stockQuantity}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {product.type === "original_stock" && (
                                <>
                                  <p>
                                    Condition:{" "}
                                    <span className="text-white/80">
                                      {formatConditionLabel(product.condition)}
                                    </span>
                                    {product.isIntact && (
                                      <span className="ml-1 text-emerald-400">
                                        (intact)
                                      </span>
                                    )}
                                  </p>
                                  {!product.isIntact && (
                                    <>
                                      {product.defectDescription && (
                                        <p className="text-orange-300">
                                          {product.defectDescription}
                                        </p>
                                      )}
                                      {product.defectImageUrl && (
                                        <a
                                          href={product.defectImageUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-fuchsia-300 underline"
                                        >
                                          View defect photo
                                        </a>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                              {product.imageUrl && (
                                <a
                                  href={product.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-fuchsia-300 underline"
                                >
                                  View product image
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white/40">
                            {product.submittedAt}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(product.id)}
                                disabled={actionId === product.id}
                                className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30 transition-all hover:bg-emerald-500/25 hover:text-emerald-300 disabled:opacity-50"
                              >
                                {actionId === product.id ? "…" : "Approve"}
                              </button>
                              <button
                                onClick={() => setRejectTarget(product)}
                                disabled={actionId === product.id}
                                className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30 transition-all hover:bg-red-500/25 hover:text-red-300 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <AdminOrdersTable
            orders={orders}
            loading={loading}
            onRefresh={fetchDashboardData}
            onError={(message) => showToast(message, "error")}
          />
        </div>
      </main>
    </div>
  );
}
