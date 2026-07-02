import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

export type { CustomerRow };

export async function getCustomers(supabase: DB): Promise<CustomerRow[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getCustomer(
  supabase: DB,
  id: string,
): Promise<CustomerRow> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createCustomer(
  supabase: DB,
  input: {
    name: string;
    address: string;
    phone?: string | null;
    notes?: string | null;
  },
): Promise<CustomerRow> {
  const { data, error } = await supabase
    .from("customers")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(
  supabase: DB,
  id: string,
  input: Partial<Pick<CustomerRow, "name" | "address" | "phone" | "notes">>,
): Promise<CustomerRow> {
  const { data, error } = await supabase
    .from("customers")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
