import { SellerShell } from "@/components/seller/seller-shell";
import { requireSeller } from "@/lib/auth/require-seller";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seller = await requireSeller();

  return <SellerShell seller={seller}>{children}</SellerShell>;
}
