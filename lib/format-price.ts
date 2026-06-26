const egpFormatter = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
});

export function formatPrice(amount: number): string {
  return egpFormatter.format(amount);
}
