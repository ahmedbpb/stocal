export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type AdminOrder = {
  id: string;
  status: OrderStatus;
  productTitle: string;
  productPrice: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  selectedSize: string | null;
  selectedColor: string | null;
  submittedAt: string;
};
