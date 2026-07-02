import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getFactoryOrder } from "@/features/factory-orders/api/factory-orders";
import { FactoryOrderDetailView } from "@/features/factory-orders/components/factory-order-detail-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Factory Order — SHE WAWA" };

export default async function FactoryOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const order = await getFactoryOrder(supabase, id);
    return <FactoryOrderDetailView id={id} initialData={order} />;
  } catch {
    notFound();
  }
}
