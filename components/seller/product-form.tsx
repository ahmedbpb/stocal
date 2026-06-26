"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import {
  MAX_PRODUCT_IMAGES,
  PRODUCT_CATEGORIES,
  PRODUCT_GENDERS,
} from "@/lib/product-constants";
import type { ProductVariantInput } from "@/lib/product-variants";
import { STOCK_CONDITIONS } from "@/lib/seller/product-helpers";
import {
  sellerProductFormSchema,
  validateImageCount,
} from "@/lib/seller/product-schema";
import type { SellerProduct } from "@/lib/seller/types";
import type { SellerSession } from "@/lib/auth/require-seller";
import {
  createSellerProduct,
  updateSellerProduct,
} from "@/app/seller/actions";
import { VariantsEditor } from "@/components/seller/variants-editor";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.07] disabled:opacity-50";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50";

const sectionClass =
  "space-y-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5";

type ProductFormProps = {
  seller: SellerSession;
  product?: SellerProduct;
};

export function ProductForm({ seller, product }: ProductFormProps) {
  const isEdit = Boolean(product);
  const brandName = seller.fullName?.trim() || "Your Brand";

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(
    product?.category ?? PRODUCT_CATEGORIES[0],
  );
  const [gender, setGender] = useState(
    product?.gender ?? PRODUCT_GENDERS[2],
  );
  const [material, setMaterial] = useState(product?.material ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [variants, setVariants] = useState<ProductVariantInput[]>(
    product?.variants ?? [],
  );
  const [condition, setCondition] = useState(
    product?.condition ?? STOCK_CONDITIONS[2].value,
  );
  const [hasDefects, setHasDefects] = useState<"yes" | "no">(
    product && !product.isIntact ? "yes" : "no",
  );
  const [defectDescription, setDefectDescription] = useState(
    product?.defectDescription ?? "",
  );
  const [existingUrls, setExistingUrls] = useState<string[]>(
    product?.imageUrls ?? [],
  );
  const [images, setImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [defectImage, setDefectImage] = useState<File | null>(null);
  const [defectPreview, setDefectPreview] = useState<string | null>(
    product?.defectImageUrl ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleImagesChange(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files);
    const imageError = validateImageCount(
      existingUrls.length + newPreviews.length,
      picked.length,
    );
    if (imageError) {
      setError(imageError);
      return;
    }
    setError(null);
    setImages((prev) => [...prev, ...picked]);
    picked.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setNewPreviews((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function removeExistingImage(index: number) {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDefectImageChange(file: File | null) {
    if (!file) return;
    setDefectImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setDefectPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const priceNum = Number.parseFloat(price);
    const formValues = {
      title,
      description,
      category,
      gender,
      material,
      sku: sku.trim() || undefined,
      price: priceNum,
      variants,
    };

    const parsed = sellerProductFormSchema.safeParse(formValues);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form data.");
      return;
    }

    const imageError = validateImageCount(existingUrls.length, images.length);
    if (imageError) {
      setError(imageError);
      return;
    }

    if (seller.role === "stock_seller" && hasDefects === "yes") {
      if (defectDescription.trim().length < 10) {
        setError("Describe the defect (at least 10 characters).");
        return;
      }
      if (!defectImage && !product?.defectImageUrl) {
        setError("Upload a defect photo.");
        return;
      }
    }

    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("variants", JSON.stringify(variants));
    images.forEach((file) => formData.append("images", file));
    existingUrls.forEach((url) => formData.append("existingImageUrls", url));
    if (defectImage) {
      formData.set("defectImage", defectImage);
    }

    const result = isEdit
      ? await updateSellerProduct(product!.id, formData)
      : await createSellerProduct(formData);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {isEdit && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Editing this product will re-submit it for admin approval.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className={sectionClass}>
        <h3 className="text-sm font-semibold text-white/80">Brand</h3>
        <div>
          <label className={labelClass}>Brand name</label>
          <input
            value={brandName}
            readOnly
            disabled
            className={`${inputClass} cursor-not-allowed opacity-70`}
          />
          <p className="mt-1.5 text-xs text-white/40">
            This is your registered brand name
          </p>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="text-sm font-semibold text-white/80">Basic info</h3>

        <div>
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Product title"
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="Describe your product"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className={labelClass}>
              Category
            </label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#1a1a1a]">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gender" className={labelClass}>
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={inputClass}
            >
              {PRODUCT_GENDERS.map((g) => (
                <option key={g} value={g} className="bg-[#1a1a1a]">
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="material" className={labelClass}>
              Material
            </label>
            <input
              id="material"
              name="material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className={inputClass}
              placeholder="e.g. 100% Cotton"
            />
          </div>

          <div>
            <label htmlFor="sku" className={labelClass}>
              SKU (optional)
            </label>
            <input
              id="sku"
              name="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className={inputClass}
              placeholder="Your reference code"
            />
          </div>
        </div>

        <div>
          <label htmlFor="price" className={labelClass}>
            Price (EGP)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="text-sm font-semibold text-white/80">Product images</h3>
        <p className="text-xs text-white/40">
          Upload 1–{MAX_PRODUCT_IMAGES} images. The first image is the cover.
        </p>
        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleImagesChange(e.target.files)}
          className="block w-full text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white"
        />
        {(existingUrls.length > 0 || newPreviews.length > 0) && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {existingUrls.map((src, index) => (
              <div
                key={`existing-${src}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10"
              >
                {index === 0 && (
                  <span className="absolute left-1 top-1 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
                    Cover
                  </span>
                )}
                <Image
                  src={src}
                  alt={`Existing ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute right-1 top-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
            {newPreviews.map((src, index) => (
              <div
                key={`new-${src}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10"
              >
                <Image
                  src={src}
                  alt={`New ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute right-1 top-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <VariantsEditor variants={variants} onChange={setVariants} />

      {seller.role === "stock_seller" && (
        <section className={sectionClass}>
          <h3 className="text-sm font-semibold text-white/80">
            Item condition
          </h3>

          <div>
            <label htmlFor="condition" className={labelClass}>
              Condition
            </label>
            <select
              id="condition"
              name="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={inputClass}
            >
              {STOCK_CONDITIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1a1a1a]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className={labelClass}>Any defects?</p>
            <div className="flex gap-3">
              {(["no", "yes"] as const).map((value) => (
                <label
                  key={value}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm transition-colors ${
                    hasDefects === value
                      ? "border-white/30 bg-white/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="hasDefects"
                    value={value}
                    checked={hasDefects === value}
                    onChange={() => setHasDefects(value)}
                    className="sr-only"
                  />
                  {value === "yes" ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </div>

          {hasDefects === "yes" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="defectDescription" className={labelClass}>
                  Describe the defect and its location
                </label>
                <textarea
                  id="defectDescription"
                  name="defectDescription"
                  value={defectDescription}
                  onChange={(e) => setDefectDescription(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-y`}
                  placeholder='e.g. "small stain on left sleeve"'
                />
              </div>

              <div>
                <label htmlFor="defectImage" className={labelClass}>
                  Upload defect photo
                </label>
                <input
                  id="defectImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleDefectImageChange(e.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white"
                />
                {defectPreview && (
                  <div className="relative mt-3 h-32 w-32 overflow-hidden rounded-xl border border-white/10">
                    <Image
                      src={defectPreview}
                      alt="Defect preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting
          ? "Saving…"
          : isEdit
            ? "Update & re-submit"
            : "Submit for approval"}
      </button>
    </form>
  );
}
