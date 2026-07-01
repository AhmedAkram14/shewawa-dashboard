import type { SupabaseClient } from "@supabase/supabase-js";

import type { FactoryOrderSummary } from "@/features/factory-orders/api/factory-orders";
import type {
  DeliverySummary,
  PackingCustomer,
} from "@/features/deliveries/api/deliveries";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type NeedsAttentionItem =
  | {
      kind: "listing";
      id: string;
      product_name: string;
      stage: "decision" | "receiving";
    }
  | {
      kind: "delivery";
      id: string;
      customer_name: string;
      status: "failed" | "refused";
    };

export type TodayKpis = {
  active_orders: number;
  out_for_delivery: number;
  delivered_today: number;
  ready_to_pack: number;
};

export type TodaySnapshot = {
  kpis: TodayKpis;
  needs_attention: NeedsAttentionItem[];
  waiting_factory: FactoryOrderSummary[];
  ready_packing: PackingCustomer[];
  out_for_delivery: DeliverySummary[];
  delivered_today: DeliverySummary[];
};

export async function getTodaySnapshot(client: Client): Promise<TodaySnapshot> {
  const todayStart = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";

  const [
    activeCountResult,
    attentionListingsResult,
    attentionDeliveriesResult,
    placedFactoryResult,
    packingOrdersResult,
    linkedOrdersResult,
    outDeliveryResult,
    deliveredTodayResult,
  ] = await Promise.all([
    client
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),

    client
      .from("listings")
      .select("id, status, products(name)")
      .in("status", ["decision", "receiving"])
      .order("created_at"),

    client
      .from("deliveries")
      .select("id, status, customers(id, name)")
      .in("status", ["failed", "refused"])
      .order("updated_at", { ascending: false }),

    client
      .from("factory_orders")
      .select("*, factories(id, name)")
      .eq("status", "placed")
      .order("created_at", { ascending: false }),

    client
      .from("orders")
      .select(
        "id, listing_id, variant_id, quantity, unit_price, customers(id, name, phone), listings!inner(id, status, products(name)), product_variants(id, name)",
      )
      .eq("status", "active")
      .eq("listings.status", "ready_for_packing"),

    client.from("delivery_orders").select("order_id"),

    client
      .from("deliveries")
      .select("*, customers(id, name, phone), delivery_orders(id)")
      .eq("status", "out_for_delivery")
      .order("created_at", { ascending: false }),

    client
      .from("deliveries")
      .select("*, customers(id, name, phone), delivery_orders(id)")
      .eq("status", "delivered")
      .gte("updated_at", todayStart)
      .order("updated_at", { ascending: false }),
  ]);

  for (const r of [
    activeCountResult,
    attentionListingsResult,
    attentionDeliveriesResult,
    placedFactoryResult,
    packingOrdersResult,
    linkedOrdersResult,
    outDeliveryResult,
    deliveredTodayResult,
  ]) {
    if (r.error) throw r.error;
  }

  // Needs Attention
  const needs_attention: NeedsAttentionItem[] = [
    ...(attentionListingsResult.data ?? []).map((l) => ({
      kind: "listing" as const,
      id: l.id,
      product_name:
        (l.products as unknown as { name: string } | null)?.name ?? "—",
      stage: l.status as "decision" | "receiving",
    })),
    ...(attentionDeliveriesResult.data ?? []).map((d) => ({
      kind: "delivery" as const,
      id: d.id,
      customer_name:
        (d.customers as unknown as { name: string } | null)?.name ?? "—",
      status: d.status as "failed" | "refused",
    })),
  ];

  // Waiting for Factory
  const waiting_factory = (placedFactoryResult.data ??
    []) as unknown as FactoryOrderSummary[];

  // Ready for Packing — exclude orders already in a delivery
  const linkedIds = new Set(
    (linkedOrdersResult.data ?? []).map((l) => l.order_id),
  );
  const unassigned = (packingOrdersResult.data ?? []).filter(
    (o) => !linkedIds.has(o.id),
  );

  const packingMap = new Map<string, PackingCustomer>();
  for (const o of unassigned) {
    const c = o.customers as unknown as {
      id: string;
      name: string;
      phone: string | null;
    };
    if (!packingMap.has(c.id)) {
      packingMap.set(c.id, { customer: c, orders: [] });
    }
    packingMap.get(c.id)!.orders.push({
      id: o.id,
      listing_id: o.listing_id,
      variant_id: o.variant_id,
      quantity: o.quantity,
      unit_price: o.unit_price,
      listings: o.listings as unknown as {
        id: string;
        products: { name: string };
      },
      product_variants: o.product_variants as unknown as {
        id: string;
        name: string;
      },
    });
  }
  const ready_packing = [...packingMap.values()];

  function mapSummary(data: typeof outDeliveryResult.data): DeliverySummary[] {
    return (data ?? []).map((d) => ({
      ...d,
      order_count: Array.isArray(d.delivery_orders)
        ? d.delivery_orders.length
        : 0,
    })) as unknown as DeliverySummary[];
  }

  return {
    kpis: {
      active_orders: activeCountResult.count ?? 0,
      out_for_delivery: (outDeliveryResult.data ?? []).length,
      delivered_today: (deliveredTodayResult.data ?? []).length,
      ready_to_pack: ready_packing.length,
    },
    needs_attention,
    waiting_factory,
    ready_packing,
    out_for_delivery: mapSummary(outDeliveryResult.data),
    delivered_today: mapSummary(deliveredTodayResult.data),
  };
}
