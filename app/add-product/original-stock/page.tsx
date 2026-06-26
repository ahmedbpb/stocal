"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AmbientBackground } from "@/components/AmbientBackground";
import { PRODUCT_CATEGORIES } from "@/lib/product-constants";
import { createOriginalStockProduct } from "../actions";
import { supabase } from "@/lib/supabase";

const DEFECT_MIN_CHARS = 20;
const DEFECT_MAX_CHARS = 500;

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.07] disabled:opacity-50";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50";

export default function OriginalStockAddProductPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<(typeof PRODUCT_CATEGORIES)[number]>(
    PRODUCT_CATEGORIES[0],
  );
  const [condition, setCondition] = useState<"new" | "used">("used");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [defectDescription, setDefectDescription] = useState("");
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
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

      if (profile?.role !== "stock_seller") {
        setError(
          "This form requires an Original Stock seller account. Ask an admin to set your role to stock_seller.",
        );
        setReady(true);
        return;
      }

      setUserId(user.id);
      setReady(true);
    }

    init();
  }, [router]);

  function handleProofImagesChange(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files);
    setProofImages((prev) => [...prev, ...picked]);
    picked.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProofPreviews((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function removeProofImage(index: number) {
    setProofImages((prev) => prev.filter((_, i) => i !== index));
    setProofPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!userId) return;

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (defectDescription.trim().length < DEFECT_MIN_CHARS) {
      setError(
        `Defect description must be at least ${DEFECT_MIN_CHARS} characters.`,
      );
      return;
    }
    if (proofImages.length === 0) {
      setError("Upload close-up photos of declared defects for condition proof.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("price", price);
      formData.append("category", category);
      formData.append("condition", condition);
      formData.append("sizes", sizes);
      formData.append("colors", colors);
      formData.append("stockQuantity", stockQuantity);
      formData.append("defectDescription", defectDescription.trim());
      proofImages.forEach((file) => formData.append("images", file));

      const result = await createOriginalStockProduct(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/admin");
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

  const defectLen = defectDescription.length;
  const defectCounterColor =
    defectLen < DEFECT_MIN_CHARS
      ? "text-amber-400"
      : defectLen > DEFECT_MAX_CHARS
        ? "text-red-400"
        : "text-emerald-400";

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
          <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            Original Stock
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Transparency & Condition Grading
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Document every detail. Buyers trust listings with full defect
            disclosure and visual proof.
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
              placeholder="Nike Air Max 90 — Vintage"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className={labelClass}>Price ($)</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={uploading || !userId}
                placeholder="145.00"
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

          <div>
            <span className={labelClass}>Condition</span>
            <div className="mt-2 flex gap-3">
              {(["new", "used"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  disabled={uploading || !userId}
                  onClick={() => setCondition(opt)}
                  className={`flex-1 rounded-xl border py-3 text-sm font-semibold uppercase tracking-wider transition-all ${
                    condition === opt
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                      : "border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20"
                  }`}
                >
                  {opt}
                </button>
              ))}
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
                placeholder="41, 42, 43"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-white/30">
                Comma-separated · e.g. shoe sizes or S, M, L
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
                placeholder="Black, White"
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
              <span className="ml-1 text-amber-400/80">*</span>
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
              required
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-white/30">
              Limited units for this original stock piece · critical for inventory
            </p>
          </div>

          <div>
            <label htmlFor="defectDescription" className={labelClass}>
              Defect Description
              <span className="ml-1 text-orange-400/80">*</span>
            </label>
            <textarea
              id="defectDescription"
              value={defectDescription}
              onChange={(e) =>
                setDefectDescription(e.target.value.slice(0, DEFECT_MAX_CHARS))
              }
              disabled={uploading || !userId}
              rows={5}
              placeholder="Describe every flaw: scuffs on toe box, minor heel drag, stitching loose on left panel…"
              className={`${inputClass} resize-y min-h-[120px]`}
            />
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-white/30">
                Required — be specific for buyer trust
              </span>
              <span className={defectCounterColor}>
                {defectLen} / {DEFECT_MAX_CHARS}
                {defectLen < DEFECT_MIN_CHARS && ` (min ${DEFECT_MIN_CHARS})`}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-5">
            <div className="mb-4 flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-orange-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-orange-200">
                  Condition Proof
                </h3>
                <p className="mt-1 text-xs text-white/40">
                  Upload close-up photos of every declared defect. This powers
                  our transparency review scope.
                </p>
              </div>
            </div>

            <input
              id="proof-images"
              type="file"
              accept="image/*"
              multiple
              disabled={uploading || !userId}
              onChange={(e) => handleProofImagesChange(e.target.files)}
              className="block w-full cursor-pointer rounded-xl border border-orange-500/25 bg-black/20 px-4 py-3 text-sm text-white/70 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-orange-400 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-black hover:file:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="mt-1.5 text-xs text-white/25">
              Required · multiple photos allowed
            </p>

            {proofPreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {proofPreviews.map((src, i) => (
                  <div
                    key={i}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-orange-500/20"
                  >
                    <img
                      src={src}
                      alt={`Defect proof ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeProofImage(i)}
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gradient-to-r hover:from-amber-500 hover:via-orange-500 hover:to-red-500 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
              "Submit for Review"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
