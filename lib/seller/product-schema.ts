import { z } from "zod";
import {
  MAX_PRODUCT_IMAGES,
  PRODUCT_CATEGORIES,
  PRODUCT_GENDERS,
} from "@/lib/product-constants";
import type { ProductVariantInput } from "@/lib/product-variants";

export const variantInputSchema = z.object({
  color: z.string().trim().min(1, "Color is required"),
  size: z.string().trim().min(1, "Size is required"),
  stockQuantity: z
    .number({ error: "Stock must be a number" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
});

export const sellerProductFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters"),
  category: z.enum(PRODUCT_CATEGORIES, {
    error: "Select a valid category",
  }),
  gender: z.enum(PRODUCT_GENDERS, { error: "Select a gender" }),
  material: z.string().trim().min(1, "Material is required"),
  sku: z.string().trim().optional(),
  price: z
    .number({ error: "Enter a valid price" })
    .min(0, "Price cannot be negative"),
  variants: z
    .array(variantInputSchema)
    .min(1, "Add at least one color/size variant"),
});

export type SellerProductFormValues = z.infer<typeof sellerProductFormSchema>;

export function validateImageCount(
  existingCount: number,
  newCount: number,
): string | null {
  const total = existingCount + newCount;
  if (total < 1) return "Upload at least one product image.";
  if (total > MAX_PRODUCT_IMAGES) {
    return `Maximum ${MAX_PRODUCT_IMAGES} images allowed.`;
  }
  return null;
}

export function parseVariantsJson(raw: string): ProductVariantInput[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as ProductVariantInput[];
  } catch {
    return null;
  }
}

export function validateProductFormPayload(
  values: unknown,
):
  | { success: true; data: SellerProductFormValues }
  | { success: false; error: string } {
  const result = sellerProductFormSchema.safeParse(values);
  if (!result.success) {
    const first = result.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid form data." };
  }
  return { success: true, data: result.data };
}
