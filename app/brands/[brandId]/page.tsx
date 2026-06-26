import { notFound } from "next/navigation";
import { CategoryProductSections } from "@/components/category-product-sections";
import { SellerStorefrontHeader } from "@/components/seller-storefront-header";
import { StorefrontShell } from "@/components/storefront-shell";
import { getSellerProducts, getSellerProfile } from "@/lib/browse/queries";
import { sellerRoleToProductType } from "@/lib/browse/product-type";
import { groupProductsByCategory } from "@/lib/browse/utils";

type BrandStorefrontPageProps = {
  params: Promise<{ brandId: string }>;
};

export default async function BrandStorefrontPage({
  params,
}: BrandStorefrontPageProps) {
  const { brandId } = await params;
  const seller = await getSellerProfile(brandId, "local_brand");

  if (!seller) {
    notFound();
  }

  const products = await getSellerProducts(
    brandId,
    sellerRoleToProductType("local_brand"),
  );
  const sections = groupProductsByCategory(products);

  return (
    <StorefrontShell
      backHref="/browse?type=local_brand"
      backLabel="Local Brands"
      accent="local"
    >
      <SellerStorefrontHeader
        seller={seller}
        productCount={products.length}
        accent="local"
      />
      <CategoryProductSections sections={sections} accent="local" />
    </StorefrontShell>
  );
}
