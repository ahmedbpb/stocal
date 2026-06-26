import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { sellerRoleToProductType } from "@/lib/browse/product-type";
import type { ProductType } from "@/lib/browse/types";
import { isSellerRole } from "@/lib/auth/roles";

export type SellerSession = {
  userId: string;
  role: "local_brand" | "stock_seller";
  productType: ProductType;
  fullName: string | null;
};

export async function requireSeller(): Promise<SellerSession> {
  const supabase = await createClient();
  const session = await getAuthenticatedProfile(supabase);

  if (!session) {
    redirect("/login?next=/seller/dashboard");
  }

  const role = session.profile.role;
  if (role !== "local_brand" && role !== "stock_seller") {
    redirect("/");
  }

  return {
    userId: session.user.id,
    role,
    productType: sellerRoleToProductType(role),
    fullName: session.profile.full_name,
  };
}
