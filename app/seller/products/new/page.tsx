import { ProductForm } from "@/components/seller/product-form";
import { requireSeller } from "@/lib/auth/require-seller";

export default async function NewProductPage() {
  const seller = await requireSeller();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload product</h1>
        <p className="mt-1 text-sm text-white/40">
          Submit a new listing for admin approval
        </p>
      </div>

      <ProductForm seller={seller} />
    </div>
  );
}
