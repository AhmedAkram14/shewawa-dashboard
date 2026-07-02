import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/features/products/api/products";
import { ProductsView } from "@/features/products/components/products-view";

export const metadata: Metadata = { title: "Products — SHE WAWA" };

export default async function ProductsPage() {
  const supabase = await createClient();
  const products = await getProducts(supabase);

  return <ProductsView initialData={products} />;
}
