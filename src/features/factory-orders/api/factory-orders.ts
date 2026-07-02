import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;

type FactoryOrderRow = Database["public"]["Tables"]["factory_orders"]["Row"];
type FactoryOrderLineRow =
  Database["public"]["Tables"]["factory_order_lines"]["Row"];
type OrderLineRow = Database["public"]["Tables"]["order_lines"]["Row"];

export type { FactoryOrderRow, FactoryOrderLineRow };

export type FactoryOrderWithFactory = FactoryOrderRow & {
  factories: { id: string; name: string };
};

export type FactoryOrderLineDetail = FactoryOrderLineRow & {
  product_variants: {
    id: string;
    name: string;
    products: { id: string; name: string };
  };
};

export type FactoryOrderDetail = FactoryOrderRow & {
  factories: { id: string; name: string };
  factory_order_lines: FactoryOrderLineDetail[];
};

export type PendingOrderLine = OrderLineRow & {
  orders: { order_number: number; customers: { name: string } };
  product_variants: { name: string; products: { name: string } };
};

export async function getFactoryOrders(
  supabase: DB,
): Promise<FactoryOrderWithFactory[]> {
  const { data, error } = await supabase
    .from("factory_orders")
    .select("*, factories(id, name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as FactoryOrderWithFactory[];
}

export async function getFactoryOrder(
  supabase: DB,
  id: string,
): Promise<FactoryOrderDetail> {
  const { data, error } = await supabase
    .from("factory_orders")
    .select(
      `*, factories(id, name),
      factory_order_lines(*, product_variants(id, name, products(id, name)))`,
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as FactoryOrderDetail;
}

export async function getPendingOrderLines(
  supabase: DB,
): Promise<PendingOrderLine[]> {
  const { data, error } = await supabase
    .from("order_lines")
    .select(
      `*, orders(order_number, customers(name)),
      product_variants(name, products(name))`,
    )
    .eq("status", "pending")
    .order("created_at");
  if (error) throw error;
  return data as PendingOrderLine[];
}

export async function callCreateFactoryOrder(
  supabase: DB,
  args: {
    factory_id: string;
    notes: string | null;
    groups: {
      product_variant_id: string;
      order_line_ids: string[];
    }[];
  },
): Promise<string> {
  const { data, error } = await supabase.rpc("create_factory_order", {
    p_factory_id: args.factory_id,
    p_notes: args.notes,
    p_groups: args.groups as unknown as Json,
  });
  if (error) throw error;
  return data as string;
}
