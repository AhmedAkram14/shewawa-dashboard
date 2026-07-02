import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCustomer } from "@/features/customers/api/customers";
import { CustomerDetailView } from "@/features/customers/components/customer-detail-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Customer — SHE WAWA" };

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const customer = await getCustomer(supabase, id);
    return <CustomerDetailView id={id} initialData={customer} />;
  } catch {
    notFound();
  }
}
