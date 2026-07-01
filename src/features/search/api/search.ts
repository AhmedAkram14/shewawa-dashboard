import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type SearchResultKind =
  "customer" | "product" | "listing" | "factory_order" | "delivery";

export type SearchResult = {
  kind: SearchResultKind;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

const LISTING_STATUS_LABELS: Record<string, string> = {
  collecting: "Collecting",
  decision: "Decision",
  ordered: "Ordered",
  receiving: "Receiving",
  ready_for_packing: "Ready for Packing",
  reconciled: "Reconciled",
  cancelled: "Cancelled",
};

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  refused: "Refused",
  failed: "Failed",
};

export async function searchAll(
  client: Client,
  query: string,
): Promise<SearchResult[]> {
  const q = `%${query}%`;
  const qLower = query.toLowerCase();

  // Parallel: direct ilike queries + broad recent fetches for client-side filter
  const [
    customersRes,
    productsRes,
    recentListingsRes,
    recentFactoryOrdersRes,
    recentDeliveriesRes,
  ] = await Promise.all([
    client
      .from("customers")
      .select("id, name, phone")
      .ilike("name", q)
      .limit(5),

    client.from("products").select("id, name").ilike("name", q).limit(5),

    client
      .from("listings")
      .select("id, status, products!inner(id, name)")
      .order("created_at", { ascending: false })
      .limit(50),

    client
      .from("factory_orders")
      .select("id, reference, status, factories(id, name)")
      .order("created_at", { ascending: false })
      .limit(50),

    client
      .from("deliveries")
      .select("id, status, customers(id, name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const results: SearchResult[] = [];

  // Customers
  for (const c of customersRes.data ?? []) {
    results.push({
      kind: "customer",
      id: c.id,
      title: c.name,
      subtitle: c.phone ?? undefined,
      href: `/customers/${c.id}`,
    });
  }

  // Products
  for (const p of productsRes.data ?? []) {
    results.push({
      kind: "product",
      id: p.id,
      title: p.name,
      subtitle: "Catalog product",
      href: `/listings`,
    });
  }

  // Listings — client-side filter by product name
  const matchedListings = (recentListingsRes.data ?? []).filter((l) => {
    const prod = l.products as unknown as { id: string; name: string } | null;
    return prod?.name.toLowerCase().includes(qLower);
  });
  for (const l of matchedListings.slice(0, 5)) {
    const prod = l.products as unknown as { id: string; name: string } | null;
    results.push({
      kind: "listing",
      id: l.id,
      title: prod?.name ?? "—",
      subtitle: LISTING_STATUS_LABELS[l.status] ?? l.status,
      href: `/listings/${l.id}`,
    });
  }

  // Factory Orders — client-side filter by reference or factory name
  const matchedFO = (recentFactoryOrdersRes.data ?? []).filter((fo) => {
    const factory = fo.factories as unknown as {
      id: string;
      name: string;
    } | null;
    const refMatch = fo.reference?.toLowerCase().includes(qLower) ?? false;
    const factoryMatch = factory?.name.toLowerCase().includes(qLower) ?? false;
    return refMatch || factoryMatch;
  });
  for (const fo of matchedFO.slice(0, 5)) {
    const factory = fo.factories as unknown as {
      id: string;
      name: string;
    } | null;
    results.push({
      kind: "factory_order",
      id: fo.id,
      title: fo.reference ?? `Order from ${factory?.name ?? "—"}`,
      subtitle: factory?.name,
      href: `/factory-orders/${fo.id}`,
    });
  }

  // Deliveries — client-side filter by customer name
  const matchedDeliveries = (recentDeliveriesRes.data ?? []).filter((d) => {
    const customer = d.customers as unknown as {
      id: string;
      name: string;
    } | null;
    return customer?.name.toLowerCase().includes(qLower) ?? false;
  });
  for (const d of matchedDeliveries.slice(0, 5)) {
    const customer = d.customers as unknown as {
      id: string;
      name: string;
    } | null;
    results.push({
      kind: "delivery",
      id: d.id,
      title: customer?.name ?? "—",
      subtitle: DELIVERY_STATUS_LABELS[d.status] ?? d.status,
      href: `/deliveries/${d.id}`,
    });
  }

  return results;
}
