import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];

export type ProductWithVariantCount = ProductRow & {
  product_variants: { id: string; name: string; selling_price: number }[];
};
export type ProductWithVariants = ProductRow & {
  product_variants: VariantRow[];
};

export async function getProducts(
  supabase: DB,
): Promise<ProductWithVariantCount[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(id, name, selling_price)")
    .order("name");
  if (error) throw error;
  return data as ProductWithVariantCount[];
}

export async function getProduct(
  supabase: DB,
  id: string,
): Promise<ProductWithVariants> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", id)
    .order("name", { referencedTable: "product_variants" })
    .single();
  if (error) throw error;
  return data as ProductWithVariants;
}

export async function createProduct(
  supabase: DB,
  input: { name: string; description?: string | null },
): Promise<ProductRow> {
  const { data, error } = await supabase
    .from("products")
    .insert({ name: input.name, description: input.description ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadProductImage(
  supabase: DB,
  productId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${productId}/cover.${ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function updateProduct(
  supabase: DB,
  id: string,
  input: Partial<
    Pick<ProductRow, "name" | "description" | "is_active" | "image_url">
  >,
): Promise<ProductRow> {
  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createVariant(
  supabase: DB,
  input: {
    product_id: string;
    name: string;
    sku: string | null;
    cost_price: number;
    selling_price: number;
  },
): Promise<VariantRow> {
  const { data, error } = await supabase
    .from("product_variants")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateVariant(
  supabase: DB,
  id: string,
  input: Partial<
    Pick<VariantRow, "name" | "sku" | "cost_price" | "selling_price">
  >,
): Promise<VariantRow> {
  const { data, error } = await supabase
    .from("product_variants")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVariant(supabase: DB, id: string): Promise<void> {
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
