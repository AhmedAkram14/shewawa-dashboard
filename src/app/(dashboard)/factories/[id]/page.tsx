import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getFactory } from "@/features/factories/api/factories";
import { FactoryDetailView } from "@/features/factories/components/factory-detail-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Factory — SHE WAWA" };

export default async function FactoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const factory = await getFactory(supabase, id);
    return <FactoryDetailView id={id} initialData={factory} />;
  } catch {
    notFound();
  }
}
