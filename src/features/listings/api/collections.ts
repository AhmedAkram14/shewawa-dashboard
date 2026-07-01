import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, CollectionRow } from "@/lib/supabase/database.types";
import type { CreateCollectionInput, UpdateCollectionInput } from "../schemas";

export type CollectionListing = {
  id: string;
  status: string;
  closes_on: string;
  products: { name: string };
};

export type CollectionWithListings = CollectionRow & {
  listings: CollectionListing[];
};

type Client = SupabaseClient<Database>;

export async function getCollections(client: Client) {
  const { data, error } = await client
    .from("collections")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCollection(
  client: Client,
  input: CreateCollectionInput,
) {
  const { data: businessId, error: rpcError } =
    await client.rpc("get_my_business_id");
  if (rpcError) throw rpcError;
  if (!businessId) throw new Error("Could not resolve business");

  const { data, error } = await client
    .from("collections")
    .insert({ ...input, business_id: businessId })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Insert returned no data");
  return data;
}

export async function getCollectionWithListings(
  client: Client,
  id: string,
): Promise<CollectionWithListings> {
  const { data, error } = await client
    .from("collections")
    .select(`*, listings(id, status, closes_on, products(name))`)
    .eq("id", id)
    .order("created_at", { ascending: false, referencedTable: "listings" })
    .single();

  if (error) throw error;
  if (!data) throw new Error("Collection not found");
  return data as unknown as CollectionWithListings;
}

export async function updateCollection(
  client: Client,
  id: string,
  input: UpdateCollectionInput,
) {
  const { data, error } = await client
    .from("collections")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}
