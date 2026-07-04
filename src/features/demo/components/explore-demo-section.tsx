"use client";

import { useFormStatus } from "react-dom";

import { signInAsDemo } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function DemoSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full border-coral/40 text-coral-dk hover:bg-c50 hover:border-coral/60"
      disabled={pending}
    >
      {pending ? "Loading demo…" : "Explore Demo"}
    </Button>
  );
}

export function ExploreDemoSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-3 rounded-xl border border-coral/20 bg-c50/50 p-4">
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-foreground">
            Want to explore first?
          </p>
          <p className="text-xs text-muted-foreground">
            Browse a pre-filled demo store — no account needed.
          </p>
        </div>
        <form action={signInAsDemo}>
          <DemoSubmitButton />
        </form>
      </div>
    </div>
  );
}
