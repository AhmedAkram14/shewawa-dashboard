import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getAvailableStock } from "@/features/available-stock/api/available-stock";
import { AvailableStockView } from "@/features/available-stock/components/available-stock-view";

export const metadata: Metadata = { title: "Available Stock — SHE WAWA" };

export default async function AvailableStockPage() {
  const supabase = await createClient();
  const stock = await getAvailableStock(supabase);

  return <AvailableStockView initialData={stock} />;
}
