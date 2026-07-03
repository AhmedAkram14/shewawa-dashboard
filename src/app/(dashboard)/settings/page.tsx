import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/back-button";
import { getSettings } from "@/features/settings/api/settings";
import { SettingsView } from "@/features/settings/components/settings-view";

export const metadata: Metadata = { title: "Settings — SHE WAWA" };

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = await getSettings(supabase);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-24">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-2xl font-semibold leading-tight">Settings</h1>
      </div>

      <SettingsView data={data} userId={user!.id} />
    </div>
  );
}
