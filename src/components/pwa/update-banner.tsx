"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  applyUpdate,
  initServiceWorkerUpdates,
  isUpdateWaiting,
  subscribeUpdate,
} from "@/lib/pwa/service-worker";

export function UpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    initServiceWorkerUpdates();
    setVisible(isUpdateWaiting());
    return subscribeUpdate((waiting) => setVisible(waiting));
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="mx-auto max-w-lg rounded-xl border border-c100 bg-c50 px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-4 w-4 shrink-0 text-coral-dk" />
          <p className="flex-1 text-sm font-medium text-coral-dk">
            A new version is available.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-c200 bg-transparent text-xs text-coral-dk hover:bg-c100"
              onClick={() => setVisible(false)}
            >
              Later
            </Button>
            <Button size="sm" className="text-xs" onClick={applyUpdate}>
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
