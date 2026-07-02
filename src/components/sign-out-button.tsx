"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-lg border border-destructive/30 p-4 text-left text-destructive transition-colors hover:bg-destructive/5 active:bg-destructive/10"
    >
      <LogOut className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">Sign Out</span>
    </button>
  );
}
