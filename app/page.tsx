import { ShopByCategory } from "@/components/shop-by-category";
import { getDistinctCategories } from "@/lib/browse/queries";
import HomeContent from "./HomeContent";

export default async function Home() {
  const categories = await getDistinctCategories();

  return <HomeContent categories={categories} />;
}
