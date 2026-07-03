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

export type ReceiptRecord = {
  id: string;
  quantity: number;
  received_at: string;
  reversal_of: string | null;
  notes: string | null;
};

export type FactoryPaymentRecord = {
  id: string;
  amount: number;
  paid_at: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

export type AllocationOrderLine = {
  id: string;
  order_id: string;
  quantity: number;
  allocated_quantity: number;
  status: "pending" | "at_factory" | "allocated" | "cancelled";
  orders: {
    order_number: number;
    created_at: string;
    status:
      "pending" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
    customers: { name: string };
  };
};

export type FactoryOrderLineDetail = FactoryOrderLineRow & {
  product_variants: {
    id: string;
    name: string;
    products: { id: string; name: string };
  };
  factory_receipts: ReceiptRecord[];
  order_lines: AllocationOrderLine[];
};

export type FactoryOrderDetail = FactoryOrderRow & {
  factories: { id: string; name: string };
  factory_order_lines: FactoryOrderLineDetail[];
  factory_payments: FactoryPaymentRecord[];
};

export type PendingOrderLine = OrderLineRow & {
  orders: { order_number: number; customers: { name: string } };
  product_variants: {
    name: string;
    cost_price: number;
    products: { name: string };
  };
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
      factory_payments(id, amount, paid_at, reference, notes, created_at),
      factory_order_lines(
        *,
        product_variants(id, name, products(id, name)),
        factory_receipts(id, quantity, received_at, reversal_of, notes),
        order_lines(id, order_id, quantity, allocated_quantity, status,
          orders(order_number, created_at, status, customers(name)))
      )`,
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
      product_variants(name, cost_price, products(name))`,
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
      unit_cost?: number | null;
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

export async function callAppendFactoryOrder(
  supabase: DB,
  args: { factory_order_id: string; order_line_ids: string[] },
): Promise<void> {
  const { error } = await supabase.rpc("append_factory_order", {
    p_factory_order_id: args.factory_order_id,
    p_order_line_ids: args.order_line_ids,
  });
  if (error) throw error;
}

export async function callSetFactoryLineCost(
  supabase: DB,
  args: { line_id: string; unit_cost: number | null },
): Promise<void> {
  const { error } = await supabase.rpc("set_factory_line_cost", {
    p_line_id: args.line_id,
    p_unit_cost: args.unit_cost,
  });
  if (error) throw error;
}

export async function callRecordFactoryPayment(
  supabase: DB,
  args: {
    factory_order_id: string;
    amount: number;
    paid_at: string;
    reference: string | null;
    notes: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("factory_payments").insert({
    factory_order_id: args.factory_order_id,
    amount: args.amount,
    paid_at: args.paid_at,
    reference: args.reference,
    notes: args.notes,
  });
  if (error) throw error;
}

export async function callRecordFactoryReceipts(
  supabase: DB,
  args: {
    factory_order_id: string;
    received_at: string;
    notes: string | null;
    receipts: {
      factory_order_line_id: string;
      quantity: number;
      allocations: { order_line_id: string; quantity: number }[];
    }[];
  },
): Promise<void> {
  const { error } = await supabase.rpc("record_factory_receipts", {
    p_factory_order_id: args.factory_order_id,
    p_received_at: args.received_at,
    p_notes: args.notes,
    p_receipts: args.receipts as unknown as Json,
  });
  if (error) throw error;
}
