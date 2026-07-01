import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { CreateProductInput, UpdateProductInput } from "../schemas";

type Client = SupabaseClient<Database>;

export async function getProducts(client: Client) {
  const { data, error } = await client
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProduct(client: Client, id: string) {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Product not found");
  return data;
}

export async function createProduct(client: Client, input: CreateProductInput) {
  const { data: businessId, error: rpcError } =
    await client.rpc("get_my_business_id");
  if (rpcError) throw rpcError;
  if (!businessId) throw new Error("Could not resolve business");

  const { data, error } = await client
    .from("products")
    .insert({
      ...input,
      image_url: input.image_url || null,
      business_id: businessId,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Insert returned no data");
  return data;
}

export async function updateProduct(
  client: Client,
  id: string,
  input: UpdateProductInput,
) {
  const { data, error } = await client
    .from("products")
    .update({ ...input, image_url: input.image_url || null })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}

export async function deleteProduct(client: Client, id: string) {
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) throw error;
}
