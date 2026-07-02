import type { Metadata } from "next";

import { getCustomers } from "@/features/customers/api/customers";
import { CustomersView } from "@/features/customers/components/customers-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Customers — SHE WAWA" };

export default async function CustomersPage() {
  const supabase = await createClient();
  const customers = await getCustomers(supabase);

  return <CustomersView initialData={customers} />;
}
