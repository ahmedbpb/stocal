import { colorToSwatch } from "@/lib/product-variants";

export function VariantPreview({
  colors,
  sizes,
}: {
  colors: string[];
  sizes: string[];
}) {
  if (colors.length === 0 && sizes.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {colors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {colors.slice(0, 6).map((color) => {
            const swatch = colorToSwatch(color);
            return swatch ? (
              <span
                key={color}
                title={color}
                className="inline-block h-4 w-4 rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: swatch }}
              />
            ) : (
              <span
                key={color}
                className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
              >
                {color}
              </span>
            );
          })}
          {colors.length > 6 && (
            <span className="text-[10px] text-white/40">
              +{colors.length - 6}
            </span>
          )}
        </div>
      )}
      {sizes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sizes.slice(0, 5).map((size) => (
            <span
              key={size}
              className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/50"
            >
              {size}
            </span>
          ))}
          {sizes.length > 5 && (
            <span className="text-[10px] text-white/40">
              +{sizes.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
