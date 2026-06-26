"use client";

import { useState } from "react";
import { VARIANT_SIZE_OPTIONS } from "@/lib/product-constants";
import type { ProductVariantInput } from "@/lib/product-variants";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30";

type VariantsEditorProps = {
  variants: ProductVariantInput[];
  onChange: (variants: ProductVariantInput[]) => void;
};

type DraftVariant = {
  color: string;
  size: string;
  stockQuantity: string;
};

const emptyDraft = (): DraftVariant => ({
  color: "",
  size: VARIANT_SIZE_OPTIONS[2],
  stockQuantity: "1",
});

export function VariantsEditor({ variants, onChange }: VariantsEditorProps) {
  const [showDraft, setShowDraft] = useState(false);
  const [draft, setDraft] = useState<DraftVariant>(emptyDraft);
  const [draftError, setDraftError] = useState<string | null>(null);

  const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);

  function confirmDraft() {
    const color = draft.color.trim();
    const size = draft.size.trim();
    const stock = Number.parseInt(draft.stockQuantity, 10);

    if (!color) {
      setDraftError("Color is required.");
      return;
    }
    if (!size) {
      setDraftError("Size is required.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setDraftError("Enter a valid stock quantity.");
      return;
    }

    const duplicate = variants.some(
      (v) =>
        v.color.toLowerCase() === color.toLowerCase() &&
        v.size.toLowerCase() === size.toLowerCase(),
    );
    if (duplicate) {
      setDraftError("This color/size combination already exists.");
      return;
    }

    onChange([...variants, { color, size, stockQuantity: stock }]);
    setDraft(emptyDraft());
    setDraftError(null);
    setShowDraft(false);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white/80">Variants</h3>
          <p className="mt-1 text-xs text-white/40">
            Add every color and size combination you sell
          </p>
        </div>
        {!showDraft && (
          <button
            type="button"
            onClick={() => {
              setShowDraft(true);
              setDraftError(null);
            }}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/[0.08]"
          >
            + Add Variant
          </button>
        )}
      </div>

      {variants.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/40">
                <th className="px-4 py-3 font-medium">Color</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Stock Qty</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {variants.map((variant, index) => (
                <tr key={`${variant.color}-${variant.size}-${index}`}>
                  <td className="px-4 py-3 text-white">{variant.color}</td>
                  <td className="px-4 py-3 text-white/80">{variant.size}</td>
                  <td className="px-4 py-3 text-white/80">
                    {variant.stockQuantity}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="rounded-md px-2 py-1 text-base text-red-400 transition-colors hover:bg-red-500/10"
                      aria-label="Remove variant"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
          No variants yet. Add at least one to continue.
        </p>
      )}

      {showDraft && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Color
              </label>
              <input
                value={draft.color}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, color: e.target.value }))
                }
                placeholder="e.g. Black"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Size
              </label>
              <select
                value={draft.size}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, size: e.target.value }))
                }
                className={inputClass}
              >
                {VARIANT_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size} className="bg-[#1a1a1a]">
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/50">
                Stock Qty
              </label>
              <input
                type="number"
                min="0"
                value={draft.stockQuantity}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    stockQuantity: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
          </div>
          {draftError && (
            <p className="text-xs text-red-300">{draftError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmDraft}
              className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDraft(false);
                setDraft(emptyDraft());
                setDraftError(null);
              }}
              className="rounded-lg px-3 py-2 text-xs text-white/50 hover:text-white/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-white/50">
        Total stock:{" "}
        <span className="font-semibold text-white">{totalStock}</span> units
      </p>
    </section>
  );
}
