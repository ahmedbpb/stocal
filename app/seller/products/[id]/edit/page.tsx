import { notFound } from "next/navigation";
import { ProductForm } from "@/components/seller/product-form";
import { requireSeller } from "@/lib/auth/require-seller";
import { getSellerProduct } from "@/lib/seller/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const seller = await requireSeller();
  const product = await getSellerProduct(seller.userId, id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit product</h1>
        <p className="mt-1 text-sm text-white/40">
          Changes will be sent back for admin approval
        </p>
      </div>

      <ProductForm seller={seller} product={product} />
    </div>
  );
}
