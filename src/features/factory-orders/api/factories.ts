import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, FactoryRow } from "@/lib/supabase/database.types";
import type { CreateFactoryInput, UpdateFactoryInput } from "../schemas";

export type FactoryWithRelations = FactoryRow & {
  products: { id: string; name: string; is_active: boolean }[];
  factory_orders: {
    id: string;
    status: string;
    reference: string | null;
    created_at: string;
    placed_at: string | null;
  }[];
};

type Client = SupabaseClient<Database>;

export async function getFactories(client: Client): Promise<FactoryRow[]> {
  const { data, error } = await client
    .from("factories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function createFactory(
  client: Client,
  input: CreateFactoryInput,
): Promise<FactoryRow> {
  const { data: businessId, error: rpcError } =
    await client.rpc("get_my_business_id");
  if (rpcError) throw rpcError;
  if (!businessId) throw new Error("Could not resolve business");

  const { data, error } = await client
    .from("factories")
    .insert({
      business_id: businessId,
      name: input.name,
      contact: input.contact ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Insert returned no data");
  return data;
}

export async function getFactoryWithRelations(
  client: Client,
  id: string,
): Promise<FactoryWithRelations> {
  const { data, error } = await client
    .from("factories")
    .select(
      `*, products(id, name, is_active),
       factory_orders(id, status, reference, created_at, placed_at)`,
    )
    .eq("id", id)
    .order("created_at", {
      ascending: false,
      referencedTable: "factory_orders",
    })
    .single();

  if (error) throw error;
  if (!data) throw new Error("Factory not found");
  return data as unknown as FactoryWithRelations;
}

export async function updateFactory(
  client: Client,
  id: string,
  input: UpdateFactoryInput,
): Promise<FactoryRow> {
  const { data, error } = await client
    .from("factories")
    .update({ name: input.name, contact: input.contact })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}
