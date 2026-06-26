"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { PRODUCT_CATEGORIES } from "@/lib/product-constants";
import { parseStockQuantity } from "@/lib/inventory";
import { parseCommaSeparatedList } from "@/lib/parse-comma-list";
import { uploadProductImages } from "@/lib/upload-images";

const DEFECT_MIN_CHARS = 20;
const DEFECT_MAX_CHARS = 500;

function getImageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function requireSeller(role: "local_brand" | "stock_seller") {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);

  if (!session) {
    return { error: "Please sign in to add a product.", supabase: null, userId: null };
  }

  if (session.profile.role !== role) {
    return {
      error: `This form requires a ${role === "local_brand" ? "Local Brand" : "Original Stock"} seller account.`,
      supabase: null,
      userId: null,
    };
  }

  return { error: null, supabase, userId: session.user.id };
}

export async function createLocalBrandProduct(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireSeller("local_brand");
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const { supabase, userId } = auth;
  const title = String(formData.get("title") ?? "").trim();
  const brandName = String(formData.get("brandName") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "");
  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const sizes = parseCommaSeparatedList(String(formData.get("sizes") ?? ""));
  const colors = parseCommaSeparatedList(String(formData.get("colors") ?? ""));
  const stockRaw = String(formData.get("stockQuantity") ?? "1");
  const images = getImageFiles(formData);

  if (!title) return { error: "Title is required." };
  if (!brandName) return { error: "Brand name is required." };

  const priceNum = parseFloat(priceRaw);
  if (!priceRaw || isNaN(priceNum) || priceNum < 0) {
    return { error: "Enter a valid price." };
  }

  if (
    !PRODUCT_CATEGORIES.includes(
      category as (typeof PRODUCT_CATEGORIES)[number],
    )
  ) {
    return { error: "Select a valid category." };
  }

  if (description.length < 30) {
    return {
      error: "Description must be at least 30 characters — tell your brand story.",
    };
  }

  if (images.length === 0) {
    return { error: "Upload at least one product image." };
  }

  const stockQuantity = parseStockQuantity(stockRaw);
  if (stockQuantity === null) {
    return { error: "Enter a valid stock quantity (0 or greater)." };
  }

  const { data: product, error: insertError } = await supabase
    .from("products")
    .insert({
      seller_id: userId,
      title,
      brand_name: brandName,
      price: priceNum,
      category,
      description,
      sizes,
      colors,
      stock_quantity: stockQuantity,
      product_type: "local_brand",
      defect_declared: false,
      approval_status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message || "Failed to create product." };
  }

  try {
    const imageUrls = await uploadProductImages(
      supabase,
      images,
      userId,
      product.id,
    );

    const { error: updateError } = await supabase
      .from("products")
      .update({ image_urls: imageUrls })
      .eq("id", product.id);

    if (updateError) {
      return { error: updateError.message || "Failed to save product images." };
    }
  } catch (err) {
    await supabase.from("products").delete().eq("id", product.id);
    const message =
      err instanceof Error ? err.message : "Failed to upload images.";
    return { error: message };
  }

  return {};
}

export async function createOriginalStockProduct(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireSeller("stock_seller");
  if (auth.error || !auth.supabase || !auth.userId) {
    return { error: auth.error ?? "Unauthorized." };
  }

  const { supabase, userId } = auth;
  const title = String(formData.get("title") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "");
  const category = String(formData.get("category") ?? "");
  const condition = String(formData.get("condition") ?? "");
  const defectDescription = String(formData.get("defectDescription") ?? "").trim();
  const sizes = parseCommaSeparatedList(String(formData.get("sizes") ?? ""));
  const colors = parseCommaSeparatedList(String(formData.get("colors") ?? ""));
  const stockRaw = String(formData.get("stockQuantity") ?? "1");
  const images = getImageFiles(formData);

  if (!title) return { error: "Title is required." };

  const priceNum = parseFloat(priceRaw);
  if (!priceRaw || isNaN(priceNum) || priceNum < 0) {
    return { error: "Enter a valid price." };
  }

  if (
    !PRODUCT_CATEGORIES.includes(
      category as (typeof PRODUCT_CATEGORIES)[number],
    )
  ) {
    return { error: "Select a valid category." };
  }

  if (condition !== "new" && condition !== "used") {
    return { error: "Select a valid condition." };
  }

  if (defectDescription.length < DEFECT_MIN_CHARS) {
    return {
      error: `Defect description must be at least ${DEFECT_MIN_CHARS} characters.`,
    };
  }

  if (defectDescription.length > DEFECT_MAX_CHARS) {
    return {
      error: `Defect description must be at most ${DEFECT_MAX_CHARS} characters.`,
    };
  }

  if (images.length === 0) {
    return {
      error: "Upload close-up photos of declared defects for condition proof.",
    };
  }

  const stockQuantity = parseStockQuantity(stockRaw);
  if (stockQuantity === null) {
    return { error: "Enter a valid stock quantity (0 or greater)." };
  }

  const { data: product, error: insertError } = await supabase
    .from("products")
    .insert({
      seller_id: userId,
      title,
      price: priceNum,
      category,
      product_type: "original_stock",
      condition,
      defect_declared: true,
      defect_description: defectDescription,
      sizes,
      colors,
      stock_quantity: stockQuantity,
      approval_status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message || "Failed to create product." };
  }

  try {
    const imageUrls = await uploadProductImages(
      supabase,
      images,
      userId,
      product.id,
    );

    const { error: updateError } = await supabase
      .from("products")
      .update({ image_urls: imageUrls })
      .eq("id", product.id);

    if (updateError) {
      return { error: updateError.message || "Failed to save product images." };
    }
  } catch (err) {
    await supabase.from("products").delete().eq("id", product.id);
    const message =
      err instanceof Error ? err.message : "Failed to upload images.";
    return { error: message };
  }

  return {};
}
