import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];

export type ProductWithVariantCount = ProductRow & {
  product_variants: { id: string }[];
};
export type ProductWithVariants = ProductRow & {
  product_variants: VariantRow[];
};

export async function getProducts(
  supabase: DB,
): Promise<ProductWithVariantCount[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(id)")
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
  input: {
    business_id: string;
    name: string;
    description?: string | null;
  },
): Promise<ProductRow> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      business_id: input.business_id,
      name: input.name,
      description: input.description ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(
  supabase: DB,
  id: string,
  input: Partial<Pick<ProductRow, "name" | "description" | "is_active">>,
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
    business_id: string;
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
