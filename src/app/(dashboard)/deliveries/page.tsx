import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getDeliveries } from "@/features/deliveries/api/deliveries";
import { DeliveriesView } from "@/features/deliveries/components/deliveries-view";

export const metadata: Metadata = { title: "Deliveries — SHE WAWA" };

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; order?: string }>;
}) {
  const supabase = await createClient();
  const [deliveries, params] = await Promise.all([
    getDeliveries(supabase),
    searchParams,
  ]);

  return (
    <DeliveriesView
      initialData={deliveries}
      autoOpen={params.new === "1"}
      preSelectedOrderId={params.order}
    />
  );
}
