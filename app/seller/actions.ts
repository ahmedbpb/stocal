"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { sellerRoleToProductType } from "@/lib/browse/product-type";
import { MAX_PRODUCT_IMAGES } from "@/lib/product-constants";
import { aggregateVariantSummary } from "@/lib/product-variants";
import { STOCK_CONDITIONS } from "@/lib/seller/product-helpers";
import {
  parseVariantsJson,
  validateImageCount,
  validateProductFormPayload,
} from "@/lib/seller/product-schema";
import { uploadDefectImage, uploadProductImages } from "@/lib/upload-images";

const DEFECT_MIN_CHARS = 10;

function getImageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function getSellerAuth() {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);

  if (!session) {
    return {
      error: "Please sign in.",
      supabase: null,
      userId: null,
      role: null,
      brandName: null,
    };
  }

  const role = session.profile.role;
  if (role !== "local_brand" && role !== "stock_seller") {
    return {
      error: "Unauthorized.",
      supabase: null,
      userId: null,
      role: null,
      brandName: null,
    };
  }

  const brandName = session.profile.full_name?.trim();
  if (!brandName) {
    return {
      error: "Set your brand name in your profile before listing products.",
      supabase: null,
      userId: null,
      role: null,
      brandName: null,
    };
  }

  return {
    error: null,
    supabase,
    userId: session.user.id,
    role,
    brandName,
  };
}

function parseFormPayload(formData: FormData) {
  const variantsRaw = parseVariantsJson(String(formData.get("variants") ?? "[]"));
  if (!variantsRaw) {
    return { error: "Invalid variant data." };
  }

  const priceNum = Number.parseFloat(String(formData.get("price") ?? ""));
  const skuRaw = String(formData.get("sku") ?? "").trim();

  const validated = validateProductFormPayload({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    material: String(formData.get("material") ?? ""),
    sku: skuRaw || undefined,
    price: priceNum,
    variants: variantsRaw,
  });

  if (!validated.success) {
    return { error: validated.error };
  }

  const keptUrls = formData
    .getAll("existingImageUrls")
    .map((entry) => String(entry))
    .filter(Boolean);
  const newImages = getImageFiles(formData);

  const imageError = validateImageCount(keptUrls.length, newImages.length);
  if (imageError) {
    return { error: imageError };
  }
  if (keptUrls.length + newImages.length > MAX_PRODUCT_IMAGES) {
    return { error: `Maximum ${MAX_PRODUCT_IMAGES} images allowed.` };
  }

  return {
    error: null,
    data: validated.data,
    keptUrls,
    newImages,
  };
}

function parseStockSellerFields(
  formData: FormData,
  options?: { existingDefectImageUrl?: string | null },
) {
  const condition = String(formData.get("condition") ?? "");
  const hasDefects = formData.get("hasDefects") === "yes";
  const defectDescription = String(formData.get("defectDescription") ?? "").trim();
  const defectImage = formData.get("defectImage");

  const validConditions = STOCK_CONDITIONS.map((c) => c.value) as string[];
  if (!validConditions.includes(condition)) {
    return { error: "Select a valid condition." };
  }

  if (hasDefects) {
    if (defectDescription.length < DEFECT_MIN_CHARS) {
      return {
        error: `Describe the defect (at least ${DEFECT_MIN_CHARS} characters).`,
      };
    }
    const hasNewImage = defectImage instanceof File && defectImage.size > 0;
    if (!hasNewImage && !options?.existingDefectImageUrl) {
      return { error: "Upload a defect photo." };
    }
  }

  return {
    error: null,
    condition,
    hasDefects,
    defectDescription: hasDefects ? defectDescription : null,
    defectImage:
      hasDefects && defectImage instanceof File && defectImage.size > 0
        ? defectImage
        : null,
    isIntact: !hasDefects,
  };
}

async function insertVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  variants: { color: string; size: string; stockQuantity: number }[],
) {
  const rows = variants.map((variant) => ({
    product_id: productId,
    color: variant.color,
    size: variant.size,
    stock_quantity: variant.stockQuantity,
  }));

  const { error } = await supabase.from("product_variants").insert(rows);
  if (error) {
    throw new Error(error.message || "Failed to save variants.");
  }
}

async function replaceVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  variants: { color: string; size: string; stockQuantity: number }[],
) {
  const { error: deleteError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    throw new Error(deleteError.message || "Failed to update variants.");
  }

  await insertVariants(supabase, productId, variants);
}

export async function createSellerProduct(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await getSellerAuth();
  if (auth.error || !auth.supabase || !auth.userId || !auth.role || !auth.brandName) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const parsed = parseFormPayload(formData);
  if (parsed.error || !parsed.data) {
    return { error: parsed.error ?? "Invalid form data." };
  }

  const { supabase, userId, role, brandName } = auth;
  const productType = sellerRoleToProductType(role);
  const { data, keptUrls, newImages } = parsed;
  const totalStock = aggregateVariantSummary(
    data.variants.map((v) => ({
      color: v.color,
      size: v.size,
      stock_quantity: v.stockQuantity,
    })),
  ).stockQuantity;

  let condition: string | null = null;
  let isIntact = true;
  let defectDescription: string | null = null;
  let defectImage: File | null = null;

  if (role === "stock_seller") {
    const stockFields = parseStockSellerFields(formData);
    if (stockFields.error) return { error: stockFields.error };
    condition = stockFields.condition;
    isIntact = stockFields.isIntact;
    defectDescription = stockFields.defectDescription;
    defectImage = stockFields.defectImage;
  }

  const { data: product, error: insertError } = await supabase
    .from("products")
    .insert({
      seller_id: userId,
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      gender: data.gender,
      material: data.material,
      sku: data.sku || null,
      brand_name: brandName,
      stock_quantity: totalStock,
      product_type: productType,
      status: "pending",
      condition,
      is_intact: isIntact,
      defect_description: defectDescription,
      defect_declared: !isIntact,
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message || "Failed to create product." };
  }

  try {
    await insertVariants(supabase, product.id, data.variants);

    let imageUrls = keptUrls;
    if (newImages.length > 0) {
      const uploaded = await uploadProductImages(
        supabase,
        newImages,
        userId,
        product.id,
      );
      imageUrls = [...keptUrls, ...uploaded];
    }

    let defectImageUrl: string | null = null;
    if (defectImage) {
      defectImageUrl = await uploadDefectImage(
        supabase,
        defectImage,
        userId,
        product.id,
      );
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        image_urls: imageUrls,
        defect_image_url: defectImageUrl,
      })
      .eq("id", product.id);

    if (updateError) {
      throw new Error(updateError.message || "Failed to save product images.");
    }
  } catch (err) {
    await supabase.from("products").delete().eq("id", product.id);
    const message =
      err instanceof Error ? err.message : "Failed to save product.";
    return { error: message };
  }

  revalidatePath("/seller/products");
  revalidatePath("/seller/dashboard");
  redirect("/seller/products?success=created");
}

export async function updateSellerProduct(
  productId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await getSellerAuth();
  if (auth.error || !auth.supabase || !auth.userId || !auth.role || !auth.brandName) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const parsed = parseFormPayload(formData);
  if (parsed.error || !parsed.data) {
    return { error: parsed.error ?? "Invalid form data." };
  }

  const { supabase, userId, role, brandName } = auth;
  const { data, keptUrls, newImages } = parsed;

  const { data: existing } = await supabase
    .from("products")
    .select("id, defect_image_url")
    .eq("id", productId)
    .eq("seller_id", userId)
    .maybeSingle();

  if (!existing) {
    return { error: "Product not found." };
  }

  const totalStock = aggregateVariantSummary(
    data.variants.map((v) => ({
      color: v.color,
      size: v.size,
      stock_quantity: v.stockQuantity,
    })),
  ).stockQuantity;

  let condition: string | null = null;
  let isIntact = true;
  let defectDescription: string | null = null;
  let defectImage: File | null = null;
  let defectImageUrl: string | null = existing.defect_image_url;

  if (role === "stock_seller") {
    const stockFields = parseStockSellerFields(formData, {
      existingDefectImageUrl: existing.defect_image_url,
    });
    if (stockFields.error) return { error: stockFields.error };
    condition = stockFields.condition;
    isIntact = stockFields.isIntact;
    defectDescription = stockFields.defectDescription;
    defectImage = stockFields.defectImage;
  }

  let imageUrls = keptUrls;
  if (newImages.length > 0) {
    try {
      const uploaded = await uploadProductImages(
        supabase,
        newImages,
        userId,
        productId,
      );
      imageUrls = [...keptUrls, ...uploaded];
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload images.";
      return { error: message };
    }
  }

  if (defectImage) {
    try {
      defectImageUrl = await uploadDefectImage(
        supabase,
        defectImage,
        userId,
        productId,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload defect image.";
      return { error: message };
    }
  }

  const updatePayload: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    price: data.price,
    category: data.category,
    gender: data.gender,
    material: data.material,
    sku: data.sku || null,
    brand_name: brandName,
    stock_quantity: totalStock,
    image_urls: imageUrls,
    status: "pending",
    rejection_reason: null,
  };

  if (role === "stock_seller") {
    updatePayload.condition = condition;
    updatePayload.is_intact = isIntact;
    updatePayload.defect_description = defectDescription;
    updatePayload.defect_declared = !isIntact;
    updatePayload.defect_image_url = defectImageUrl;
  }

  const { error: updateError } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", productId)
    .eq("seller_id", userId);

  if (updateError) {
    return { error: updateError.message || "Failed to update product." };
  }

  try {
    await replaceVariants(supabase, productId, data.variants);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update variants.";
    return { error: message };
  }

  revalidatePath("/seller/products");
  revalidatePath("/seller/dashboard");
  redirect("/seller/products?success=updated");
}

export async function deleteSellerProduct(
  productId: string,
): Promise<{ error?: string }> {
  const auth = await getSellerAuth();
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const { error } = await auth.supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("seller_id", auth.userId);

  if (error) {
    return { error: error.message || "Failed to delete product." };
  }

  revalidatePath("/seller/products");
  revalidatePath("/seller/dashboard");
  return {};
}
