export type ProductVariantRow = {
  id?: string;
  color: string;
  size: string;
  stock_quantity: number;
};

export type ProductVariantInput = {
  color: string;
  size: string;
  stockQuantity: number;
};

export type VariantSummary = {
  colors: string[];
  sizes: string[];
  stockQuantity: number;
  hasVariants: boolean;
};

export function aggregateVariantSummary(
  variants: ProductVariantRow[],
): VariantSummary {
  if (variants.length === 0) {
    return {
      colors: [],
      sizes: [],
      stockQuantity: 0,
      hasVariants: false,
    };
  }

  const colors = [...new Set(variants.map((v) => v.color))];
  const sizes = [...new Set(variants.map((v) => v.size))];
  const stockQuantity = variants.reduce(
    (sum, v) => sum + Number(v.stock_quantity ?? 0),
    0,
  );

  return {
    colors,
    sizes,
    stockQuantity,
    hasVariants: true,
  };
}

export function legacyVariantSummary(
  sizes: string[] | null | undefined,
  colors: string[] | null | undefined,
  stockQuantity: number | null | undefined,
): VariantSummary {
  return {
    colors: colors ?? [],
    sizes: sizes ?? [],
    stockQuantity: Number(stockQuantity ?? 0),
    hasVariants: false,
  };
}

export function resolveProductVariantSummary(
  variants: ProductVariantRow[] | null | undefined,
  legacy: {
    sizes?: string[] | null;
    colors?: string[] | null;
    stock_quantity?: number | null;
  },
): VariantSummary {
  const rows = variants ?? [];
  if (rows.length > 0) {
    return aggregateVariantSummary(rows);
  }
  return legacyVariantSummary(
    legacy.sizes,
    legacy.colors,
    legacy.stock_quantity,
  );
}

const COLOR_SWATCH_MAP: Record<string, string> = {
  black: "#171717",
  white: "#f5f5f5",
  red: "#ef4444",
  blue: "#3b82f6",
  navy: "#1e3a5f",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#a855f7",
  brown: "#92400e",
  beige: "#d4c4a8",
  grey: "#9ca3af",
  gray: "#9ca3af",
  cream: "#fef3c7",
  gold: "#ca8a04",
  silver: "#cbd5e1",
};

export function colorToSwatch(color: string): string | null {
  const key = color.trim().toLowerCase();
  return COLOR_SWATCH_MAP[key] ?? null;
}
