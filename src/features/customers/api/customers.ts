import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, CustomerRow } from "@/lib/supabase/database.types";
import type { CreateCustomerInput, UpdateCustomerInput } from "../schemas";

type Client = SupabaseClient<Database>;

export async function getCustomers(client: Client): Promise<CustomerRow[]> {
  const { data, error } = await client
    .from("customers")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function createCustomer(
  client: Client,
  input: CreateCustomerInput,
): Promise<CustomerRow> {
  const { data: businessId, error: rpcError } =
    await client.rpc("get_my_business_id");
  if (rpcError) throw rpcError;
  if (!businessId) throw new Error("Could not resolve business");

  const { data, error } = await client
    .from("customers")
    .insert({
      business_id: businessId,
      name: input.name,
      address: input.address,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Insert returned no data");
  return data;
}

export async function updateCustomer(
  client: Client,
  id: string,
  input: UpdateCustomerInput,
): Promise<CustomerRow> {
  const { data, error } = await client
    .from("customers")
    .update({
      name: input.name,
      address: input.address,
      phone: input.phone,
      notes: input.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}
