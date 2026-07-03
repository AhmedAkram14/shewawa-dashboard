"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  canInstall,
  dismissInstall,
  subscribeInstall,
  triggerInstall,
} from "@/lib/pwa/install";

export function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(canInstall());
    return subscribeInstall(() => setVisible(canInstall()));
  }, []);

  if (!visible) return null;

  async function handleInstall() {
    const outcome = await triggerInstall();
    if (outcome !== "accepted") setVisible(false);
  }

  function handleDismiss() {
    dismissInstall();
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-3">
      <div className="mx-auto max-w-lg rounded-xl border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-c50">
            <ArrowDownToLine className="h-5 w-5 text-coral-dk" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug">Install SHE WAWA</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Add to your home screen for faster access.
            </p>

            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleInstall} className="flex-1">
                Install
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Later
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
