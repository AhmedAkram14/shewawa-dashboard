import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, CustomerRow } from "@/lib/supabase/database.types";
import type { CreateCustomerInput, UpdateCustomerInput } from "../schemas";

export type CustomerOrder = {
  id: string;
  listing_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  status: "active" | "cancelled";
  created_at: string;
  listings: { id: string; products: { name: string } };
  product_variants: { id: string; name: string };
};

export type CustomerWithOrders = CustomerRow & {
  orders: CustomerOrder[];
  refused_delivery_count: number;
};

export type CustomerInsights = {
  totalOrders: number;
  lastOrder: CustomerOrder | null;
  refusedDeliveries: number;
  preferredVariant: string | null;
};

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

export async function getCustomerWithOrders(
  client: Client,
  id: string,
): Promise<CustomerWithOrders> {
  const [customerResult, deliveriesResult] = await Promise.all([
    client
      .from("customers")
      .select(
        `*, orders(
          id, listing_id, variant_id, quantity, unit_price, status, created_at,
          listings(id, products(name)),
          product_variants(id, name)
        )`,
      )
      .eq("id", id)
      .order("created_at", { ascending: false, referencedTable: "orders" })
      .single(),
    client
      .from("deliveries")
      .select("id")
      .eq("customer_id", id)
      .eq("status", "refused"),
  ]);

  if (customerResult.error) throw customerResult.error;
  if (!customerResult.data) throw new Error("Customer not found");
  if (deliveriesResult.error) throw deliveriesResult.error;

  return {
    ...(customerResult.data as unknown as CustomerWithOrders),
    refused_delivery_count: (deliveriesResult.data ?? []).length,
  };
}

export function computeCustomerInsights(
  customer: CustomerWithOrders,
): CustomerInsights {
  const activeOrders = customer.orders.filter((o) => o.status === "active");

  const variantCounts = new Map<string, { name: string; count: number }>();
  for (const o of activeOrders) {
    const key = o.variant_id;
    const existing = variantCounts.get(key);
    if (existing) existing.count++;
    else variantCounts.set(key, { name: o.product_variants.name, count: 1 });
  }

  const preferredVariant =
    activeOrders.length >= 2
      ? ([...variantCounts.entries()].sort(
          (a, b) => b[1].count - a[1].count,
        )[0]?.[1].name ?? null)
      : null;

  return {
    totalOrders: activeOrders.length,
    lastOrder: customer.orders[0] ?? null,
    refusedDeliveries: customer.refused_delivery_count,
    preferredVariant,
  };
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
