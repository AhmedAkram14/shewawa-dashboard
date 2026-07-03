import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getMoneyReport } from "@/features/money/api/money";
import { MoneyView } from "@/features/money/components/money-view";

export const metadata: Metadata = { title: "Money — SHE WAWA" };

export default async function MoneyPage() {
  const supabase = await createClient();

  try {
    const report = await getMoneyReport(supabase);
    return <MoneyView report={report} />;
  } catch (err) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <h1 className="mb-4 text-2xl font-semibold">Money</h1>
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err instanceof Error
            ? err.message
            : "Failed to load financial report"}
        </p>
      </div>
    );
  }
}
