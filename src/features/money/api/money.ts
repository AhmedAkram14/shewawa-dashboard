import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type ListingMoneyRow = {
  listing_id: string;
  product_name: string;
  money_in: number;
  money_out: number;
  at_risk: number;
};

export type MoneySnapshot = {
  money_in: number;
  money_out: number;
  at_risk: number;
  by_listing: ListingMoneyRow[];
};

export async function getMoneySnapshot(client: Client): Promise<MoneySnapshot> {
  // Fetch all active orders with listing product info
  const [ordersResult, deliveredLinksResult, factoryLinesResult] =
    await Promise.all([
      client
        .from("orders")
        .select(
          "id, listing_id, quantity, unit_price, listings(products(name))",
        )
        .eq("status", "active"),

      // Order IDs that are linked to a delivered delivery
      client
        .from("delivery_orders")
        .select("order_id, deliveries!inner(status)")
        .eq("deliveries.status", "delivered"),

      // Placed factory order lines with listing context
      client
        .from("factory_order_lines")
        .select("listing_id, quantity, unit_cost, factory_orders!inner(status)")
        .eq("factory_orders.status", "placed"),
    ]);

  if (ordersResult.error) throw ordersResult.error;
  if (deliveredLinksResult.error) throw deliveredLinksResult.error;
  if (factoryLinesResult.error) throw factoryLinesResult.error;

  const deliveredOrderIds = new Set(
    (deliveredLinksResult.data ?? []).map((d) => d.order_id),
  );

  const orders = ordersResult.data ?? [];
  const factoryLines = factoryLinesResult.data ?? [];

  // Per-listing accumulators
  const listingMap = new Map<
    string,
    {
      product_name: string;
      money_in: number;
      at_risk: number;
      money_out: number;
    }
  >();

  function ensureListing(id: string, name: string) {
    if (!listingMap.has(id)) {
      listingMap.set(id, {
        product_name: name,
        money_in: 0,
        at_risk: 0,
        money_out: 0,
      });
    }
    return listingMap.get(id)!;
  }

  for (const o of orders) {
    const name =
      (o.listings as unknown as { products: { name: string } } | null)?.products
        .name ?? "—";
    const value = o.quantity * o.unit_price;
    const row = ensureListing(o.listing_id, name);
    if (deliveredOrderIds.has(o.id)) {
      row.money_in += value;
    } else {
      row.at_risk += value;
    }
  }

  for (const fl of factoryLines) {
    const row = ensureListing(
      fl.listing_id,
      listingMap.get(fl.listing_id)?.product_name ?? "—",
    );
    row.money_out += fl.quantity * fl.unit_cost;
  }

  const by_listing: ListingMoneyRow[] = [...listingMap.entries()]
    .map(([listing_id, v]) => ({ listing_id, ...v }))
    .sort((a, b) => b.money_in + b.at_risk - (a.money_in + a.at_risk));

  const totals = by_listing.reduce(
    (acc, r) => ({
      money_in: acc.money_in + r.money_in,
      money_out: acc.money_out + r.money_out,
      at_risk: acc.at_risk + r.at_risk,
    }),
    { money_in: 0, money_out: 0, at_risk: 0 },
  );

  return { ...totals, by_listing };
}
