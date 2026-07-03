import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getDelivery } from "@/features/deliveries/api/deliveries";
import { DeliveryDetailView } from "@/features/deliveries/components/delivery-detail-view";

export const metadata: Metadata = { title: "Delivery — SHE WAWA" };

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  let delivery;
  try {
    delivery = await getDelivery(supabase, id);
  } catch {
    notFound();
  }

  return <DeliveryDetailView id={id} initialData={delivery} />;
}
