import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getDeliveries } from "@/features/deliveries/api/deliveries";
import { DeliveriesView } from "@/features/deliveries/components/deliveries-view";

export const metadata: Metadata = { title: "Deliveries — SHE WAWA" };

export default async function DeliveriesPage() {
  const supabase = await createClient();
  const deliveries = await getDeliveries(supabase);

  return <DeliveriesView initialData={deliveries} />;
}
