import type { Metadata } from "next";

import { getFactories } from "@/features/factories/api/factories";
import { FactoriesView } from "@/features/factories/components/factories-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Factories — SHE WAWA" };

export default async function FactoriesPage() {
  const supabase = await createClient();
  const factories = await getFactories(supabase);

  return <FactoriesView initialData={factories} />;
}
