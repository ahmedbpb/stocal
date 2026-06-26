import type { AdminOrder } from "@/app/admin/order-types";

const DEFAULT_QUANTITY = 1;

export function formatEgyptianPhoneForWhatsApp(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed || trimmed === "—") return null;

  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("20")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    digits = `20${digits.slice(1)}`;
  } else {
    digits = `20${digits}`;
  }

  return digits;
}

function formatVariant(value: string | null): string {
  return value?.trim() || "غير محدد";
}

function formatPriceEgp(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export function buildWhatsAppOrderConfirmationMessage(
  order: AdminOrder,
  quantity = DEFAULT_QUANTITY,
): string {
  const totalPrice = order.productPrice * quantity;

  return (
    `أهلاً بك! استلمنا طلبك من المنصة. ` +
    `تفاصيل الطلب: ${quantity}x من ${order.productTitle} ` +
    `(مقاس: ${formatVariant(order.selectedSize)}، لون: ${formatVariant(order.selectedColor)}). ` +
    `الإجمالي: ${formatPriceEgp(totalPrice)} جنيه. ` +
    `سيتم الشحن إلى: ${order.customerAddress}. ` +
    `برجاء الرد لتأكيد الشحن.`
  );
}

export function buildWhatsAppOrderConfirmationUrl(order: AdminOrder): string | null {
  const phone = formatEgyptianPhoneForWhatsApp(order.customerPhone);
  if (!phone) return null;

  const message = buildWhatsAppOrderConfirmationMessage(order);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
