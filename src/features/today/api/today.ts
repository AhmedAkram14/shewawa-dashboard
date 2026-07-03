import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export interface TodaySummary {
  pending_count: number;
  ready_count: number;
  out_for_delivery_count: number;
  delivered_today_count: number;
  pieces_at_factory: number;
  total_active_value: number;
  deposits_on_active: number;
  outstanding_balance: number;
  available_stock_count: number;
  pending_lines_count: number;
}

export async function getTodaySummary(
  supabase: SupabaseClient<Database>,
): Promise<TodaySummary> {
  const { data, error } = await supabase.rpc("get_today_summary");
  if (error) throw new Error(error.message);
  return data as unknown as TodaySummary;
}
