import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, FactoryOrderRow } from "@/lib/supabase/database.types";
import type { CreateFactoryOrderInput, FactoryOrderStatus } from "../schemas";

type Client = SupabaseClient<Database>;

// ── Joined types ──────────────────────────────────────────────────────────────

export type FactoryOrderSummary = Omit<FactoryOrderRow, "status"> & {
  status: FactoryOrderStatus;
  factories: { id: string; name: string };
};

export type FactoryOrderLine = {
  id: string;
  listing_id: string;
  variant_id: string;
  quantity: number;
  unit_cost: number;
  created_at: string;
  product_variants: { id: string; name: string };
  listings: { id: string; products: { name: string } };
};

export type FactoryOrderWithRelations = Omit<FactoryOrderRow, "status"> & {
  status: FactoryOrderStatus;
  factories: { id: string; name: string; contact: string | null };
  factory_order_lines: FactoryOrderLine[];
};

// A listing available for bundling into a factory order
export type DecisionListing = {
  id: string;
  catalog_product_id: string;
  closes_on: string;
  threshold: number | null;
  products: { id: string; name: string; factory_id: string | null };
  order_count: number; // computed client-side
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getFactoryOrders(
  client: Client,
): Promise<FactoryOrderSummary[]> {
  const { data, error } = await client
    .from("factory_orders")
    .select("*, factories (id, name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as FactoryOrderSummary[];
}

export async function getFactoryOrder(
  client: Client,
  id: string,
): Promise<FactoryOrderWithRelations> {
  const { data, error } = await client
    .from("factory_orders")
    .select(
      `*,
      factories (id, name, contact),
      factory_order_lines (
        id, listing_id, variant_id, quantity, unit_cost, created_at,
        product_variants (id, name),
        listings (id, products (name))
      )`,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Factory order not found");
  return data as unknown as FactoryOrderWithRelations;
}

// Listings in decision stage with no factory_order_id, same factory as given.
// Filtering by factory is done client-side (PostgREST nested filter not reliable here).
export async function getDecisionListingsByFactory(
  client: Client,
  factoryId: string,
  excludeListingId: string,
): Promise<DecisionListing[]> {
  const { data, error } = await client
    .from("listings")
    .select(
      "id, catalog_product_id, closes_on, threshold, products (id, name, factory_id)",
    )
    .eq("status", "decision")
    .is("factory_order_id", null)
    .neq("id", excludeListingId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const raw = (data ?? []) as unknown as {
    id: string;
    catalog_product_id: string;
    closes_on: string;
    threshold: number | null;
    products: { id: string; name: string; factory_id: string | null };
  }[];

  return raw
    .filter((l) => l.products.factory_id === factoryId)
    .map((l) => ({ ...l, order_count: 0 }));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createFactoryOrder(
  client: Client,
  input: CreateFactoryOrderInput,
): Promise<FactoryOrderRow> {
  const { data: businessId, error: rpcError } =
    await client.rpc("get_my_business_id");
  if (rpcError) throw rpcError;
  if (!businessId) throw new Error("Could not resolve business");

  // 1. Insert factory order
  const { data: factoryOrder, error: foError } = await client
    .from("factory_orders")
    .insert({
      business_id: businessId,
      factory_id: input.factory_id,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (foError) throw foError;
  if (!factoryOrder) throw new Error("Failed to create factory order");

  // 2. For each listing, aggregate active orders by variant → insert lines
  for (const listingId of input.listing_ids) {
    const { data: orders, error: ordersError } = await client
      .from("orders")
      .select("variant_id, quantity, product_variants (cost_price)")
      .eq("listing_id", listingId)
      .eq("status", "active");

    if (ordersError) throw ordersError;

    // Aggregate quantities by variant
    const variantMap = new Map<
      string,
      { quantity: number; unit_cost: number }
    >();
    for (const order of orders ?? []) {
      const pv = order.product_variants as unknown as { cost_price: number };
      const existing = variantMap.get(order.variant_id);
      if (existing) {
        existing.quantity += order.quantity;
      } else {
        variantMap.set(order.variant_id, {
          quantity: order.quantity,
          unit_cost: pv.cost_price,
        });
      }
    }

    if (variantMap.size > 0) {
      const lines = Array.from(variantMap.entries()).map(
        ([variant_id, data]) => ({
          business_id: businessId,
          factory_order_id: factoryOrder.id,
          listing_id: listingId,
          variant_id,
          quantity: data.quantity,
          unit_cost: data.unit_cost,
        }),
      );

      const { error: linesError } = await client
        .from("factory_order_lines")
        .insert(lines);

      if (linesError) throw linesError;
    }
  }

  // 3. Transition all selected listings to 'ordered' and link them
  const { error: listingsError } = await client
    .from("listings")
    .update({ factory_order_id: factoryOrder.id, status: "ordered" })
    .in("id", input.listing_ids);

  if (listingsError) throw listingsError;

  return factoryOrder;
}

export async function placeFactoryOrder(
  client: Client,
  id: string,
): Promise<FactoryOrderRow> {
  const { data, error } = await client
    .from("factory_orders")
    .update({
      status: "placed",
      placed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}
