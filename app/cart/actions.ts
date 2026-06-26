"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { firstJoin } from "@/lib/supabase/first-join";
import { isOutOfStock } from "@/lib/inventory";

type ProductVariant = {
  id: string;
  status: string;
  sizes: string[] | null;
  colors: string[] | null;
  price: number;
  stock_quantity: number;
};

function normalizeVariant(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Please sign in to continue.");
  }

  return { supabase, userId: user.id };
}

async function getApprovedProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
): Promise<ProductVariant> {
  const { data: product, error } = await supabase
    .from("products")
    .select("id, status, sizes, colors, price, stock_quantity")
    .eq("id", productId)
    .single();

  if (error || !product || product.status !== "approved") {
    throw new Error("This product is not available.");
  }

  if (isOutOfStock(Number(product.stock_quantity ?? 0))) {
    throw new Error("This product is out of stock.");
  }

  return product as ProductVariant;
}

function validateVariantSelection(
  product: ProductVariant,
  selectedSize: string | null,
  selectedColor: string | null,
) {
  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];

  if (sizes.length > 0 && !selectedSize) {
    throw new Error("Please select a size.");
  }

  if (colors.length > 0 && !selectedColor) {
    throw new Error("Please select a color.");
  }

  if (selectedSize && !sizes.includes(selectedSize)) {
    throw new Error("Invalid size selection.");
  }

  if (selectedColor && !colors.includes(selectedColor)) {
    throw new Error("Invalid color selection.");
  }
}

async function findExistingCartItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  productId: string,
  selectedSize: string | null,
  selectedColor: string | null,
) {
  let query = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId);

  query = selectedSize
    ? query.eq("selected_size", selectedSize)
    : query.is("selected_size", null);

  query = selectedColor
    ? query.eq("selected_color", selectedColor)
    : query.is("selected_color", null);

  const { data } = await query.maybeSingle();
  return data;
}

async function getCartQuantityForProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  productId: string,
  excludeCartItemId?: string,
): Promise<number> {
  let query = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.id !== excludeCartItemId)
    .reduce((sum, row) => sum + row.quantity, 0);
}

function getCartProduct(item: { products: unknown }): ProductVariant | null {
  return firstJoin(item.products as ProductVariant | ProductVariant[] | null);
}

function assertWithinStock(
  product: ProductVariant,
  requestedTotalQuantity: number,
) {
  if (requestedTotalQuantity > product.stock_quantity) {
    const remaining = Math.max(product.stock_quantity, 0);
    throw new Error(
      remaining === 0
        ? "This product is out of stock."
        : `Only ${remaining} unit${remaining === 1 ? "" : "s"} available.`,
    );
  }
}

export async function getCartItemCount(): Promise<number> {
  try {
    const { supabase, userId } = await requireUser();
    const { data, error } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", userId);

    if (error) return 0;
    return (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
  } catch {
    return 0;
  }
}

export async function addToCart(
  productId: string,
  selectedSize: string | null,
  selectedColor: string | null,
): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await requireUser();
    const trimmedSize = normalizeVariant(selectedSize);
    const trimmedColor = normalizeVariant(selectedColor);

    const product = await getApprovedProduct(supabase, productId);
    validateVariantSelection(product, trimmedSize, trimmedColor);

    const existing = await findExistingCartItem(
      supabase,
      userId,
      productId,
      trimmedSize,
      trimmedColor,
    );

    const currentInCart = await getCartQuantityForProduct(
      supabase,
      userId,
      productId,
    );
    const nextTotal = currentInCart + 1;
    assertWithinStock(product, nextTotal);

    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({
          quantity: existing.quantity + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("user_id", userId);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("cart_items").insert({
        user_id: userId,
        product_id: productId,
        quantity: 1,
        selected_size: trimmedSize,
        selected_color: trimmedColor,
      });

      if (error) throw new Error(error.message);
    }

    revalidatePath("/cart");
    revalidatePath("/shop/local");
    revalidatePath("/shop/stocks");
    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add to cart.";
    return { error: message };
  }
}

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number,
): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await requireUser();

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Quantity must be at least 1.");
    }

    const { data: cartItem, error: cartItemError } = await supabase
      .from("cart_items")
      .select("id, product_id")
      .eq("id", cartItemId)
      .eq("user_id", userId)
      .single();

    if (cartItemError || !cartItem) {
      throw new Error("Cart item not found.");
    }

    const product = await getApprovedProduct(supabase, cartItem.product_id);
    const otherLinesQty = await getCartQuantityForProduct(
      supabase,
      userId,
      cartItem.product_id,
      cartItemId,
    );
    assertWithinStock(product, otherLinesQty + quantity);

    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cartItemId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    revalidatePath("/cart");
    return {};
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update quantity.";
    return { error: message };
  }
}

export async function removeCartItem(
  cartItemId: string,
): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await requireUser();

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    revalidatePath("/cart");
    return {};
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to remove item.";
    return { error: message };
  }
}

export async function checkoutCart(
  phone: string,
  address: string,
): Promise<{ error?: string; orderCount?: number; totalAmount?: number }> {
  try {
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (!trimmedPhone || !trimmedAddress) {
      throw new Error("Phone number and delivery address are required.");
    }

    const { supabase, userId } = await requireUser();

    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(
        "id, quantity, selected_size, selected_color, products(id, status, sizes, colors, price, stock_quantity)",
      )
      .eq("user_id", userId);

    if (cartError) throw new Error(cartError.message);

    if (!cartItems?.length) {
      throw new Error("Your cart is empty.");
    }

    const productDemand = new Map<string, number>();

    for (const item of cartItems) {
      const product = getCartProduct(item);
      if (!product || product.status !== "approved") {
        throw new Error("One or more cart items are no longer available.");
      }

      const selectedSize = normalizeVariant(item.selected_size);
      const selectedColor = normalizeVariant(item.selected_color);
      validateVariantSelection(product, selectedSize, selectedColor);

      const currentDemand = productDemand.get(product.id) ?? 0;
      productDemand.set(product.id, currentDemand + item.quantity);
    }

    for (const item of cartItems) {
      const product = getCartProduct(item);
      if (!product) {
        throw new Error("One or more cart items are no longer available.");
      }
      const demand = productDemand.get(product.id) ?? 0;
      assertWithinStock(product, demand);
    }

    const orderRows: Array<{
      product_id: string;
      buyer_id: string;
      status: string;
      phone: string;
      address: string;
      selected_size: string | null;
      selected_color: string | null;
    }> = [];

    let totalAmount = 0;

    for (const item of cartItems) {
      const product = getCartProduct(item);
      if (!product || product.status !== "approved") {
        throw new Error("One or more cart items are no longer available.");
      }

      const selectedSize = normalizeVariant(item.selected_size);
      const selectedColor = normalizeVariant(item.selected_color);
      validateVariantSelection(product, selectedSize, selectedColor);

      const lineTotal = Number(product.price) * item.quantity;
      totalAmount += lineTotal;

      for (let i = 0; i < item.quantity; i++) {
        orderRows.push({
          product_id: product.id,
          buyer_id: userId,
          status: "pending",
          phone: trimmedPhone,
          address: trimmedAddress,
          selected_size: selectedSize,
          selected_color: selectedColor,
        });
      }
    }

    const { error: insertError } = await supabase.from("orders").insert(orderRows);
    if (insertError) throw new Error(insertError.message);

    for (const [productId, purchasedQty] of productDemand) {
      const { error: stockError } = await supabase.rpc("deduct_product_stock", {
        p_product_id: productId,
        p_quantity: purchasedQty,
      });

      if (stockError) {
        throw new Error(stockError.message || "Failed to update inventory.");
      }
    }

    const { error: clearError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);

    if (clearError) throw new Error(clearError.message);

    revalidatePath("/cart");
    revalidatePath("/orders");
    revalidatePath("/shop/local");
    revalidatePath("/shop/stocks");

    return {
      orderCount: orderRows.length,
      totalAmount,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to complete checkout.";
    return { error: message };
  }
}
