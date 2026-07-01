import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, DeliveryRow } from "@/lib/supabase/database.types";
import type { DeliveryStatus, CreateDeliveryInput } from "../schemas";

type Client = SupabaseClient<Database>;

// ── Summary type (list view) ──────────────────────────────────────────────────

export type DeliverySummary = Omit<DeliveryRow, "status"> & {
  status: DeliveryStatus;
  customers: { id: string; name: string; phone: string | null };
  order_count: number;
};

// ── Detail types (detail view) ────────────────────────────────────────────────

export type DeliveryOrderItem = {
  id: string;
  order_id: string;
  orders: {
    id: string;
    listing_id: string;
    variant_id: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
    listings: { id: string; products: { name: string } };
    product_variants: { id: string; name: string };
  };
};

export type DeliveryWithRelations = Omit<DeliveryRow, "status"> & {
  status: DeliveryStatus;
  customers: {
    id: string;
    name: string;
    address: string;
    phone: string | null;
  };
  delivery_orders: DeliveryOrderItem[];
};

// ── Packing customer types ────────────────────────────────────────────────────

export type PackingOrder = {
  id: string;
  listing_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  listings: { id: string; products: { name: string } };
  product_variants: { id: string; name: string };
};

export type PackingCustomer = {
  customer: { id: string; name: string; phone: string | null };
  orders: PackingOrder[];
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getDeliveries(client: Client) {
  const { data, error } = await client
    .from("deliveries")
    .select(
      `*, customers(id, name, phone),
       delivery_orders(id)`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((d) => ({
    ...d,
    status: d.status as DeliveryStatus,
    order_count: Array.isArray(d.delivery_orders)
      ? d.delivery_orders.length
      : 0,
  })) as unknown as DeliverySummary[];
}

export async function getDelivery(client: Client, id: string) {
  const { data, error } = await client
    .from("deliveries")
    .select(
      `*, customers(id, name, address, phone),
       delivery_orders(
         id, order_id,
         orders(
           id, listing_id, variant_id, quantity, unit_price, notes,
           listings(id, products(name)),
           product_variants(id, name)
         )
       )`,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Delivery not found");
  return data as unknown as DeliveryWithRelations;
}

export async function getPackingCustomers(client: Client) {
  // Orders from ready_for_packing listings that are active and not yet in any delivery
  const { data, error } = await client
    .from("orders")
    .select(
      `id, listing_id, variant_id, quantity, unit_price,
       listings!inner(id, status, products(name)),
       product_variants(id, name),
       customers(id, name, phone)`,
    )
    .eq("status", "active")
    .eq("listings.status", "ready_for_packing");

  if (error) throw error;

  // Fetch order IDs already in an active delivery.
  // Refused and failed deliveries release their orders back to the packing queue.
  const { data: linked, error: linkedError } = await client
    .from("delivery_orders")
    .select("order_id, deliveries!inner(status)");

  if (linkedError) throw linkedError;

  const linkedIds = new Set(
    (linked ?? [])
      .filter((l) => {
        const s = (l.deliveries as unknown as { status: string }).status;
        return s !== "refused" && s !== "failed";
      })
      .map((l) => l.order_id),
  );

  const unassigned = (data ?? []).filter((o) => !linkedIds.has(o.id));

  // Group by customer
  const map = new Map<string, PackingCustomer>();
  for (const o of unassigned) {
    const c = o.customers as { id: string; name: string; phone: string | null };
    if (!map.has(c.id)) {
      map.set(c.id, { customer: c, orders: [] });
    }
    map.get(c.id)!.orders.push({
      id: o.id,
      listing_id: o.listing_id,
      variant_id: o.variant_id,
      quantity: o.quantity,
      unit_price: o.unit_price,
      listings: o.listings as unknown as {
        id: string;
        products: { name: string };
      },
      product_variants: o.product_variants as { id: string; name: string },
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.customer.name.localeCompare(b.customer.name),
  );
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createDelivery(
  client: Client,
  input: CreateDeliveryInput,
) {
  const { data: businessId, error: rpcError } =
    await client.rpc("get_my_business_id");
  if (rpcError) throw rpcError;
  if (!businessId) throw new Error("Could not resolve business");

  const { data: delivery, error: deliveryError } = await client
    .from("deliveries")
    .insert({
      business_id: businessId,
      customer_id: input.customer_id,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (deliveryError) throw deliveryError;
  if (!delivery) throw new Error("Insert returned no data");

  const lines = input.order_ids.map((order_id) => ({
    business_id: businessId,
    delivery_id: delivery.id,
    order_id,
  }));

  const { error: linesError } = await client
    .from("delivery_orders")
    .insert(lines);

  if (linesError) throw linesError;

  return delivery;
}

export async function updateDeliveryStatus(
  client: Client,
  id: string,
  status: DeliveryStatus,
) {
  const { data, error } = await client
    .from("deliveries")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}
