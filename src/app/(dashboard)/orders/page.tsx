import type { Metadata } from "next";

import { getOrders } from "@/features/orders/api/orders";
import { OrdersView } from "@/features/orders/components/orders-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Orders — SHE WAWA" };

export default async function OrdersPage() {
  const supabase = await createClient();
  const orders = await getOrders(supabase);

  return <OrdersView initialData={orders} />;
}
