"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { isDemoUser } from "@/lib/demo";

export function DemoBanner() {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading || !isDemoUser(user?.email)) return null;

  return (
    <div className="shrink-0 border-b border-coral/20 bg-c50/70">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2">
        <p className="min-w-0 text-xs text-coral-dk">
          <span className="font-semibold">Demo mode</span>
          {" — "}
          Exploring SHE WAWA. Changes may be reset at any time.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 text-xs font-medium text-coral-dk hover:bg-coral/10 hover:text-coral-dk"
          onClick={() => router.push("/login")}
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}
