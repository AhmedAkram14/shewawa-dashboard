import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  AvailableStockRow,
} from "@/lib/supabase/database.types";
import type { AddStockInput, UpdateStockInput } from "../schemas";

type Client = SupabaseClient<Database>;

export type AvailableStockEntry = Omit<
  AvailableStockRow,
  "reason" | "variant_id" | "listing_id"
> & {
  reason: AvailableStockRow["reason"];
  product_variants: {
    id: string;
    name: string;
    products: { id: string; name: string };
  };
  listings: { id: string; products: { name: string } } | null;
};

export async function getAvailableStock(client: Client) {
  const { data, error } = await client
    .from("available_stock")
    .select(
      `*, product_variants(id, name, products(id, name)),
       listings(id, products(name))`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as AvailableStockEntry[];
}

export async function addAvailableStock(client: Client, input: AddStockInput) {
  const { data: businessId, error: rpcError } =
    await client.rpc("get_my_business_id");
  if (rpcError) throw rpcError;
  if (!businessId) throw new Error("Could not resolve business");

  const { data, error } = await client
    .from("available_stock")
    .insert({
      business_id: businessId,
      variant_id: input.variant_id,
      listing_id: input.listing_id ?? null,
      quantity: input.quantity,
      reason: input.reason,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Insert returned no data");
  return data;
}

export async function updateAvailableStock(
  client: Client,
  id: string,
  input: UpdateStockInput,
) {
  const { data, error } = await client
    .from("available_stock")
    .update({ quantity: input.quantity, notes: input.notes ?? null })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}
