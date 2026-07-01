import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { CreateVariantInput, UpdateVariantInput } from "../schemas";

type Client = SupabaseClient<Database>;

export async function getVariants(client: Client, productId: string) {
  const { data, error } = await client
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createVariant(client: Client, input: CreateVariantInput) {
  // Resolve business_id from the parent product.
  // RLS on products guarantees the product belongs to the current tenant.
  const { data: product, error: productError } = await client
    .from("products")
    .select("business_id")
    .eq("id", input.product_id)
    .single();

  if (productError) throw productError;
  if (!product) throw new Error("Product not found");

  const { data, error } = await client
    .from("product_variants")
    .insert({ ...input, business_id: product.business_id })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Insert returned no data");
  return data;
}

export async function updateVariant(
  client: Client,
  id: string,
  input: UpdateVariantInput,
) {
  const { data, error } = await client
    .from("product_variants")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}

export async function deleteVariant(client: Client, id: string) {
  const { error } = await client.from("product_variants").delete().eq("id", id);
  if (error) throw error;
}
