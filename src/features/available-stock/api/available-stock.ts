import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;

export type StockEntry = {
  id: string;
  product_variant_id: string;
  quantity: number;
  source: "factory_surplus" | "cancellation" | "manual";
  notes: string | null;
  created_at: string;
  product_variants: {
    id: string;
    name: string;
    products: { id: string; name: string };
  };
};

export type PendingOrderLineForVariant = {
  id: string;
  quantity: number;
  allocated_quantity: number;
  orders: {
    id: string;
    order_number: number;
    customers: { name: string };
  };
};

export async function getAvailableStock(supabase: DB): Promise<StockEntry[]> {
  const { data, error } = await supabase
    .from("available_stock")
    .select("*, product_variants(id, name, products(id, name))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as StockEntry[];
}

export async function getPendingLinesForVariant(
  supabase: DB,
  productVariantId: string,
): Promise<PendingOrderLineForVariant[]> {
  const { data, error } = await supabase
    .from("order_lines")
    .select(
      "id, quantity, allocated_quantity, orders(id, order_number, customers(name))",
    )
    .eq("product_variant_id", productVariantId)
    .eq("status", "pending")
    .order("created_at");
  if (error) throw error;
  // Filter client-side: only lines with remaining quantity
  return (data as PendingOrderLineForVariant[]).filter(
    (l) => l.allocated_quantity < l.quantity,
  );
}

export async function callAllocateFromStock(
  supabase: DB,
  args: { stock_id: string; order_line_id: string; quantity: number },
): Promise<void> {
  const { error } = await supabase.rpc("allocate_from_stock", {
    p_stock_id: args.stock_id,
    p_order_line_id: args.order_line_id,
    p_quantity: args.quantity,
  });
  if (error) throw error;
}

export async function callAddManualStock(
  supabase: DB,
  args: {
    product_variant_id: string;
    quantity: number;
    notes: string | null;
  },
): Promise<void> {
  const { error } = await supabase.rpc("add_manual_stock", {
    p_product_variant_id: args.product_variant_id,
    p_quantity: args.quantity,
    p_notes: args.notes,
  });
  if (error) throw error;
}
