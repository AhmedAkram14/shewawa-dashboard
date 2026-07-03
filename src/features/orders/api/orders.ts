import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderLineRow = Database["public"]["Tables"]["order_lines"]["Row"];

export type { OrderRow, OrderLineRow };

export type OrderWithCustomer = OrderRow & {
  customers: { id: string; name: string };
  order_lines: { quantity: number; unit_price: number }[];
};

export type OrderLineDetail = OrderLineRow & {
  product_variants: {
    id: string;
    name: string;
    products: { id: string; name: string };
  };
};

export type OrderDetail = OrderRow & {
  customers: {
    id: string;
    name: string;
    address: string;
    phone: string | null;
  };
  order_lines: OrderLineDetail[];
};

export type ProductForPicker = {
  id: string;
  name: string;
  product_variants: { id: string; name: string; selling_price: number }[];
};

export async function getOrders(supabase: DB): Promise<OrderWithCustomer[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, customers(id, name), order_lines(quantity, unit_price)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as OrderWithCustomer[];
}

export async function getOrder(supabase: DB, id: string): Promise<OrderDetail> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `*, customers(id, name, address, phone),
      order_lines(*, product_variants(id, name, products(id, name)))`,
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as OrderDetail;
}

export async function getProductsForPicker(
  supabase: DB,
): Promise<ProductForPicker[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, product_variants(id, name, selling_price)")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data as ProductForPicker[];
}

export async function callUpdateOrder(
  supabase: DB,
  args: { order_id: string; deposit_amount: number; notes: string | null },
): Promise<void> {
  const { error } = await supabase.rpc("update_order", {
    p_order_id: args.order_id,
    p_deposit_amount: args.deposit_amount,
    p_notes: args.notes,
  });
  if (error) throw error;
}

export async function callCancelOrder(
  supabase: DB,
  order_id: string,
): Promise<void> {
  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: order_id,
  });
  if (error) throw error;
}

export async function callCreateOrder(
  supabase: DB,
  args: {
    customer_id: string;
    deposit_amount: number;
    notes: string | null;
    lines: {
      product_variant_id: string;
      quantity: number;
      unit_price: number;
    }[];
  },
): Promise<string> {
  const { data, error } = await supabase.rpc("create_order", {
    p_customer_id: args.customer_id,
    p_deposit_amount: args.deposit_amount,
    p_notes: args.notes,
    p_lines: args.lines as unknown as Json,
  });
  if (error) throw error;
  return data as string;
}
