import type { Metadata } from "next";

import { getFactoryOrders } from "@/features/factory-orders/api/factory-orders";
import { FactoryOrdersView } from "@/features/factory-orders/components/factory-orders-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Factory Orders — SHE WAWA" };

export default async function FactoryOrdersPage() {
  const supabase = await createClient();
  const orders = await getFactoryOrders(supabase);

  return <FactoryOrdersView initialData={orders} />;
}
