import type { Metadata } from "next";

import { signOut } from "@/app/(auth)/actions";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Settings — SHE WAWA" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-2xl font-semibold leading-tight">Settings</h1>
      </div>

      <form action={signOut}>
        <Button variant="outline" type="submit" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
