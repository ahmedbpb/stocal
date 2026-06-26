export function isOutOfStock(stockQuantity: number): boolean {
  return stockQuantity <= 0;
}

export function parseStockQuantity(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const value = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

export function formatStockLabel(stockQuantity: number): string {
  if (isOutOfStock(stockQuantity)) return "Sold Out";
  if (stockQuantity <= 3) return `Only ${stockQuantity} left`;
  return `${stockQuantity} in stock`;
}
