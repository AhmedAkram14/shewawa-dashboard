import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, OrderRow } from "@/lib/supabase/database.types";
import type { CreateOrderInput, UpdateOrderInput } from "../schemas";

type Client = SupabaseClient<Database>;

// ── Joined types ──────────────────────────────────────────────────────────────

export type OrderWithRelations = OrderRow & {
  customers: { id: string; name: string; phone: string | null };
  product_variants: { id: string; name: string; selling_price: number };
};

export type OrderWithListingInfo = OrderRow & {
  customers: { id: string; name: string; phone: string | null };
  product_variants: { id: string; name: string; selling_price: number };
  listings: { id: string; status: string; products: { name: string } };
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getOrdersByListing(
  client: Client,
  listingId: string,
): Promise<OrderWithRelations[]> {
  const { data, error } = await client
    .from("orders")
    .select(
      "*, customers (id, name, phone), product_variants (id, name, selling_price)",
    )
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as OrderWithRelations[];
}

export async function getAllOrders(
  client: Client,
): Promise<OrderWithListingInfo[]> {
  const { data, error } = await client
    .from("orders")
    .select(
      "*, customers (id, name, phone), product_variants (id, name, selling_price), listings (id, status, products (name))",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as OrderWithListingInfo[];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createOrder(
  client: Client,
  input: CreateOrderInput,
): Promise<OrderRow> {
  const { data: businessId, error: rpcError } =
    await client.rpc("get_my_business_id");
  if (rpcError) throw rpcError;
  if (!businessId) throw new Error("Could not resolve business");

  const { data, error } = await client
    .from("orders")
    .insert({
      business_id: businessId,
      listing_id: input.listing_id,
      customer_id: input.customer_id,
      variant_id: input.variant_id,
      quantity: input.quantity,
      unit_price: input.unit_price,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Insert returned no data");
  return data;
}

export async function updateOrder(
  client: Client,
  id: string,
  input: UpdateOrderInput,
): Promise<OrderRow> {
  const { data, error } = await client
    .from("orders")
    .update({
      quantity: input.quantity,
      notes: input.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}

export async function cancelOrder(
  client: Client,
  id: string,
): Promise<OrderRow> {
  const { data, error } = await client
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}
