export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "cancelled";

export function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "border-amber-500/30 bg-amber-500/15 text-amber-300";
    case "confirmed":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    case "shipped":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    case "cancelled":
      return "border-red-500/30 bg-red-500/15 text-red-300";
  }
}
