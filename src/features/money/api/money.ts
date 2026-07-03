import type { SupabaseClient } from "@supabase/supabase-js";

export type OrderStatus = "pending" | "ready" | "out_for_delivery";

export interface MoneyOrderRow {
  id: string;
  order_number: number;
  customer_name: string;
  status: OrderStatus;
  order_value: number;
  deposit_amount: number;
  balance_due: number;
}

export interface MoneyStatusBucket {
  order_count: number;
  value: number;
  deposits: number;
  balance: number;
}

export interface MoneyReport {
  total_active_value: number;
  deposits_collected: number;
  outstanding_balance: number;
  active_order_count: number;
  by_status: Partial<Record<OrderStatus, MoneyStatusBucket>>;
  orders: MoneyOrderRow[];
}

export async function getMoneyReport(
  supabase: SupabaseClient,
): Promise<MoneyReport> {
  const { data, error } = await supabase.rpc("get_money_report");
  if (error) throw new Error(error.message);
  return data as MoneyReport;
}
