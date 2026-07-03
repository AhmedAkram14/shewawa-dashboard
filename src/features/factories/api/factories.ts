import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;
type FactoryRow = Database["public"]["Tables"]["factories"]["Row"];

export type { FactoryRow };

export type FactoryWithStats = FactoryRow & {
  factory_orders: { id: string; status: string }[];
};

export async function getFactories(supabase: DB): Promise<FactoryWithStats[]> {
  const { data, error } = await supabase
    .from("factories")
    .select("*, factory_orders(id, status)")
    .order("name");
  if (error) throw error;
  return data as FactoryWithStats[];
}

export async function getFactory(
  supabase: DB,
  id: string,
): Promise<FactoryRow> {
  const { data, error } = await supabase
    .from("factories")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createFactory(
  supabase: DB,
  input: { name: string; contact?: string | null; notes?: string | null },
): Promise<FactoryRow> {
  const { data, error } = await supabase
    .from("factories")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFactory(
  supabase: DB,
  id: string,
  input: Partial<Pick<FactoryRow, "name" | "contact" | "notes">>,
): Promise<FactoryRow> {
  const { data, error } = await supabase
    .from("factories")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
