import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProduct } from "@/features/products/api/products";
import { ProductDetailView } from "@/features/products/components/product-detail-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Product — SHE WAWA" };

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const product = await getProduct(supabase, id);
    return <ProductDetailView id={id} initialData={product} />;
  } catch {
    notFound();
  }
}
