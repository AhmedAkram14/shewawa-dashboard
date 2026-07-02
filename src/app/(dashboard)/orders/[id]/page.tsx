import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getOrder } from "@/features/orders/api/orders";
import { OrderDetailView } from "@/features/orders/components/order-detail-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Order — SHE WAWA" };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const order = await getOrder(supabase, id);
    return <OrderDetailView id={id} initialData={order} />;
  } catch {
    notFound();
  }
}
