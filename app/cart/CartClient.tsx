"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  checkoutCart,
  removeCartItem,
  updateCartItemQuantity,
} from "./actions";
import { notifyCartUpdated, type CartItem } from "@/lib/cart/types";
import { isOutOfStock } from "@/lib/inventory";

type Toast = {
  message: string;
  type: "success" | "error";
};

function ToastNotification({ toast }: { toast: Toast }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-2xl backdrop-blur-md ${
        toast.type === "success"
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
          : "border-red-500/30 bg-red-500/15 text-red-200"
      }`}
    >
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
}

export default function CartClient({ items: initialItems }: { items: CartItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [toast, setToast] = useState<Toast | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  function getProductCartTotal(productId: string): number {
    return items
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  function getMaxQuantityForItem(item: CartItem): number {
    return item.product.stockQuantity;
  }

  function canIncreaseQuantity(item: CartItem): boolean {
    const productTotal = getProductCartTotal(item.product.id);
    return productTotal < item.product.stockQuantity;
  }

  const hasStockIssues = items.some((item) => {
    const productTotal = getProductCartTotal(item.product.id);
    return (
      isOutOfStock(item.product.stockQuantity) ||
      item.product.approvalStatus !== "approved" ||
      productTotal > item.product.stockQuantity
    );
  });

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  function refreshCartState(nextItems: CartItem[]) {
    setItems(nextItems);
    notifyCartUpdated();
    router.refresh();
  }

  async function handleQuantityChange(cartItemId: string, nextQuantity: number) {
    if (nextQuantity < 1) return;

    setBusyId(cartItemId);
    const result = await updateCartItemQuantity(cartItemId, nextQuantity);

    if (result.error) {
      showToast(result.error, "error");
    } else {
      refreshCartState(
        items.map((item) =>
          item.id === cartItemId ? { ...item, quantity: nextQuantity } : item,
        ),
      );
    }

    setBusyId(null);
  }

  async function handleRemove(cartItemId: string) {
    setBusyId(cartItemId);
    const result = await removeCartItem(cartItemId);

    if (result.error) {
      showToast(result.error, "error");
    } else {
      refreshCartState(items.filter((item) => item.id !== cartItemId));
    }

    setBusyId(null);
  }

  function openCheckoutModal() {
    if (items.length === 0) return;
    setPhone("");
    setAddress("");
    setShowCheckoutModal(true);
  }

  function closeCheckoutModal() {
    if (checkingOut) return;
    setShowCheckoutModal(false);
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();

    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (!trimmedPhone || !trimmedAddress) {
      showToast("Please enter your phone number and delivery address.", "error");
      return;
    }

    setCheckingOut(true);

    const result = await checkoutCart(trimmedPhone, trimmedAddress);

    if (result.error) {
      showToast(result.error, "error");
      setCheckingOut(false);
      return;
    }

    setShowCheckoutModal(false);
    refreshCartState([]);
    notifyCartUpdated();
    showToast(
      `${result.orderCount} order request${result.orderCount === 1 ? "" : "s"} submitted! Total: $${(result.totalAmount ?? 0).toFixed(2)}`,
      "success",
    );
    setCheckingOut(false);
  }

  return (
    <>
      {toast && <ToastNotification toast={toast} />}

      {showCheckoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-modal-title"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={closeCheckoutModal}
            disabled={checkingOut}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <h2
              id="checkout-modal-title"
              className="text-lg font-semibold tracking-tight"
            >
              Delivery Details
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Enter your contact info once for all {itemCount} item
              {itemCount === 1 ? "" : "s"} in your cart.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-white/40">
                Order total
              </p>
              <p className="mt-1 text-2xl font-bold">${total.toFixed(2)}</p>
            </div>

            <form onSubmit={handleCheckout} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-semibold uppercase tracking-wider text-white/50"
                >
                  Phone Number
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  required
                  autoFocus
                  disabled={checkingOut}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-white/30 focus:ring-1 focus:ring-white/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-address"
                  className="block text-xs font-semibold uppercase tracking-wider text-white/50"
                >
                  Delivery Address
                </label>
                <textarea
                  id="checkout-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, city, postal code…"
                  required
                  rows={3}
                  disabled={checkingOut}
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-white/30 focus:ring-1 focus:ring-white/20 disabled:opacity-60"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCheckoutModal}
                  disabled={checkingOut}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkingOut}
                  className="flex-1 rounded-xl bg-white py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gradient-to-r hover:from-violet-500 hover:via-fuchsia-500 hover:to-cyan-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkingOut ? "Processing…" : "Confirm Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12">
        <header className="mb-8">
          <Link
            href="/"
            className="text-xs uppercase tracking-wider text-white/40 hover:text-white/70"
          >
            ← Continue shopping
          </Link>
          <h1
            className="mt-6 text-3xl font-black tracking-tight sm:text-4xl"
            style={{
              background:
                "linear-gradient(180deg, #ffffff 0%, #ffffff 50%, rgba(255,255,255,0.4) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your Cart
          </h1>
          <p className="mt-2 text-sm text-white/40">
            {itemCount === 0
              ? "No items yet — browse the shop and add something you love."
              : `${itemCount} item${itemCount === 1 ? "" : "s"} ready for checkout`}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-20 text-center backdrop-blur-md">
            <p className="text-lg font-medium text-white/60">Your cart is empty</p>
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
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <ul className="space-y-4">
              {items.map((item) => {
                const lineTotal = item.product.price * item.quantity;
                const unavailable = item.product.approvalStatus !== "approved";
                const soldOut = isOutOfStock(item.product.stockQuantity);
                const productCartTotal = getProductCartTotal(item.product.id);
                const overStock = productCartTotal > item.product.stockQuantity;
                const maxQty = getMaxQuantityForItem(item);

                return (
                  <li
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md"
                  >
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                      <Link
                        href={`/product/${item.product.id}`}
                        className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] sm:h-24 sm:w-24"
                      >
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.title}
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
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.product.id}`}
                          className="font-semibold text-white hover:text-white/80"
                        >
                          {item.product.title}
                        </Link>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.selectedSize && (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60">
                              Color: {item.selectedColor}
                            </span>
                          )}
                        </div>

                        {unavailable && (
                          <p className="mt-2 text-xs text-red-400">
                            This item is no longer available and will be skipped at
                            checkout.
                          </p>
                        )}
                        {(soldOut || overStock) && !unavailable && (
                          <p className="mt-2 text-xs text-red-400">
                            {soldOut
                              ? "This item is out of stock. Remove it to continue."
                              : `Only ${maxQty} available — reduce quantity to checkout.`}
                          </p>
                        )}
                        {!soldOut && !overStock && maxQty <= 3 && (
                          <p className="mt-2 text-xs text-amber-400/80">
                            Only {maxQty} left in stock
                          </p>
                        )}

                        <p className="mt-3 text-sm text-white/40">
                          ${item.product.price.toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03]">
                          <button
                            type="button"
                            disabled={busyId === item.id || item.quantity <= 1}
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            className="px-3 py-2 text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={busyId === item.id || !canIncreaseQuantity(item)}
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            className="px-3 py-2 text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold">${lineTotal.toFixed(2)}</p>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleRemove(item.id)}
                            className="mt-1 text-xs text-white/40 transition-colors hover:text-red-400 disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                Order Summary
              </h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Items ({itemCount})</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Shipping</span>
                  <span className="text-emerald-400/80">Arranged on confirm</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between border-t border-white/10 pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={openCheckoutModal}
                disabled={hasStockIssues}
                className="mt-6 w-full rounded-xl bg-white py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gradient-to-r hover:from-violet-500 hover:via-fuchsia-500 hover:to-cyan-400 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
