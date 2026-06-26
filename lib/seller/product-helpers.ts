export const STOCK_CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
] as const;

export function formatConditionLabel(condition: string | null): string {
  if (!condition) return "—";
  const match = STOCK_CONDITIONS.find((c) => c.value === condition);
  if (match) return match.label;
  if (condition === "used") return "Used";
  return condition;
}

export function formatProductStatus(status: string): string {
  return status.toUpperCase();
}
