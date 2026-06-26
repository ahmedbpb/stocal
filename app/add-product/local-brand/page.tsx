"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AmbientBackground } from "@/components/AmbientBackground";
import { PRODUCT_CATEGORIES } from "@/lib/product-constants";
import { createLocalBrandProduct } from "../actions";
import { supabase } from "@/lib/supabase";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.07] disabled:opacity-50";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50";

export default function LocalBrandAddProductPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<(typeof PRODUCT_CATEGORIES)[number]>(
    PRODUCT_CATEGORIES[0],
  );
  const [description, setDescription] = useState("");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "local_brand") {
        setError(
          "This form requires a Local Brand seller account. Ask an admin to set your role to local_brand.",
        );
        setReady(true);
        return;
      }

      setUserId(user.id);
      setReady(true);
    }

    init();
  }, [router]);

  function handleImagesChange(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files);
    setImages((prev) => [...prev, ...picked]);
    picked.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!userId) return;

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!brandName.trim()) {
      setError("Brand name is required.");
      return;
    }
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (description.trim().length < 30) {
      setError("Description must be at least 30 characters — tell your brand story.");
      return;
    }
    if (images.length === 0) {
      setError("Upload at least one product image.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("brandName", brandName.trim());
      formData.append("price", price);
      formData.append("category", category);
      formData.append("description", description.trim());
      formData.append("sizes", sizes);
      formData.append("colors", colors);
      formData.append("stockQuantity", stockQuantity);
      images.forEach((file) => formData.append("images", file));

      const result = await createLocalBrandProduct(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit product.";
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white/50">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <AmbientBackground />

      <main className="relative z-10 mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/admin"
          className="text-xs uppercase tracking-wider text-white/40 hover:text-white/70"
        >
          ← Back to dashboard
        </Link>

        <header className="mt-6 mb-8">
          <span className="inline-flex rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
            Local Brand
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Tell Your Brand Story
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Craft a premium listing that showcases your label&apos;s identity and
            vision.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md"
        >
          <div>
            <label htmlFor="title" className={labelClass}>Title</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading || !userId}
              placeholder="Oversized Acid Wash Hoodie"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="brandName" className={labelClass}>Brand Name</label>
            <input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              disabled={uploading || !userId}
              placeholder="Void District"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className={labelClass}>Price (EGP)</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={uploading || !userId}
                placeholder="89.00"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="category" className={labelClass}>Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as (typeof PRODUCT_CATEGORIES)[number],
                  )
                }
                disabled={uploading || !userId}
                className={inputClass}
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#1a1a1a]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sizes" className={labelClass}>
                Sizes
              </label>
              <input
                id="sizes"
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                disabled={uploading || !userId}
                placeholder="S, M, L, XL"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-white/30">
                Comma-separated · leave blank if one size fits all
              </p>
            </div>
            <div>
              <label htmlFor="colors" className={labelClass}>
                Colors
              </label>
              <input
                id="colors"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                disabled={uploading || !userId}
                placeholder="Black, White, Navy"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-white/30">
                Comma-separated · leave blank if single color
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="stockQuantity" className={labelClass}>
              Stock Quantity
            </label>
            <input
              id="stockQuantity"
              type="number"
              min="0"
              step="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              disabled={uploading || !userId}
              placeholder="1"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-white/30">
              Units available for sale · set to 0 when sold out
            </p>
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Product Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading || !userId}
              rows={6}
              placeholder="Share the inspiration, materials, fit, and what makes this piece special to your brand…"
              className={`${inputClass} resize-y min-h-[140px]`}
            />
            <p className="mt-1.5 text-xs text-white/30">
              {description.length} characters · min 30
            </p>
          </div>

          <div>
            <label htmlFor="product-images" className={labelClass}>
              Image Upload
            </label>
            <input
              id="product-images"
              type="file"
              accept="image/*"
              multiple
              disabled={uploading || !userId}
              onChange={(e) => handleImagesChange(e.target.files)}
              className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-black hover:file:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="mt-1.5 text-xs text-white/30">
              JPG, PNG, WEBP — multiple allowed
            </p>

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-white/10"
                  >
                    <img
                      src={src}
                      alt={`Preview ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !userId}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gradient-to-r hover:from-violet-500 hover:via-fuchsia-500 hover:to-cyan-400 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading…
              </>
            ) : (
              "Submit for Approval"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
