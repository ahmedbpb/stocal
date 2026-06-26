import { notFound } from "next/navigation";
import { CategoryProductSections } from "@/components/category-product-sections";
import { SellerStorefrontHeader } from "@/components/seller-storefront-header";
import { StorefrontShell } from "@/components/storefront-shell";
import { getSellerProducts, getSellerProfile } from "@/lib/browse/queries";
import { sellerRoleToProductType } from "@/lib/browse/product-type";
import { groupProductsByCategory } from "@/lib/browse/utils";

type StockStorefrontPageProps = {
  params: Promise<{ sellerId: string }>;
};

export default async function StockStorefrontPage({
  params,
}: StockStorefrontPageProps) {
  const { sellerId } = await params;
  const seller = await getSellerProfile(sellerId, "stock_seller");

  if (!seller) {
    notFound();
  }

  const products = await getSellerProducts(
    sellerId,
    sellerRoleToProductType("stock_seller"),
  );
  const sections = groupProductsByCategory(products);

  return (
    <StorefrontShell
      backHref="/browse?type=stock_seller"
      backLabel="Original Stock"
      accent="stock"
    >
      <SellerStorefrontHeader
        seller={seller}
        productCount={products.length}
        accent="stock"
      />
      <CategoryProductSections sections={sections} accent="stock" />
    </StorefrontShell>
  );
}
