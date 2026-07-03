import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;

type DeliveryRow = Database["public"]["Tables"]["deliveries"]["Row"];

export type { DeliveryRow };

export type DeliveryWithOrderCount = DeliveryRow & {
  orders: { id: string }[];
};

export type DeliveryOrderSummary = {
  id: string;
  order_number: number;
  status: string;
  deposit_amount: number;
  delivered_at: string | null;
  customers: { id: string; name: string };
  order_lines: { quantity: number; unit_price: number }[];
};

export type DeliveryDetail = DeliveryRow & {
  orders: DeliveryOrderSummary[];
};

export type ReadyOrder = {
  id: string;
  order_number: number;
  customers: { id: string; name: string };
  order_lines: { quantity: number }[];
};

export async function getDeliveries(
  supabase: DB,
): Promise<DeliveryWithOrderCount[]> {
  const { data, error } = await supabase
    .from("deliveries")
    .select("*, orders(id)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as DeliveryWithOrderCount[];
}

export async function getDelivery(
  supabase: DB,
  id: string,
): Promise<DeliveryDetail> {
  const { data, error } = await supabase
    .from("deliveries")
    .select(
      `*, orders(
        id, order_number, status, deposit_amount, delivered_at,
        customers(id, name),
        order_lines(quantity, unit_price)
      )`,
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as DeliveryDetail;
}

export async function getReadyOrders(supabase: DB): Promise<ReadyOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customers(id, name), order_lines(quantity)")
    .eq("status", "ready")
    .order("created_at");
  if (error) throw error;
  return data as ReadyOrder[];
}

export async function callCreateDelivery(
  supabase: DB,
  args: { order_ids: string[]; notes: string | null },
): Promise<string> {
  const { data, error } = await supabase.rpc("create_delivery", {
    p_order_ids: args.order_ids,
    p_notes: args.notes,
  });
  if (error) throw error;
  return data as string;
}

export async function callDispatchDelivery(
  supabase: DB,
  deliveryId: string,
): Promise<void> {
  const { error } = await supabase.rpc("dispatch_delivery", {
    p_delivery_id: deliveryId,
  });
  if (error) throw error;
}

export type FailedOrderOutcome = {
  order_id: string;
  failure_reason?: string | null;
  courier_notes?: string | null;
};

export async function callCompleteDelivery(
  supabase: DB,
  deliveryId: string,
  failedOrders: FailedOrderOutcome[] = [],
): Promise<void> {
  const { error } = await supabase.rpc("complete_delivery", {
    p_delivery_id: deliveryId,
    p_failed_orders: failedOrders as unknown as Json,
  });
  if (error) throw error;
}
