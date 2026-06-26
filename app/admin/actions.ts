"use server";

import { revalidatePath } from "next/cache";
import {
  ORDER_STATUSES,
  type OrderStatus,
} from "@/app/admin/order-types";
import { assertSuperAdmin } from "@/lib/auth/require-super-admin";

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  if (!isOrderStatus(newStatus)) {
    throw new Error("Invalid order status");
  }

  const { supabase } = await assertSuperAdmin();

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message || "Failed to update order status");
  }

  revalidatePath("/admin");
}
