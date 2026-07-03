"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { isOnline, subscribeOnline } from "@/lib/pwa/offline";

export function OfflineScreen() {
  // Start optimistically online; correct on mount so SSR never flashes the screen
  const [online, setOnline] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    setOnline(isOnline());
    return subscribeOnline((nowOnline) => {
      setOnline(nowOnline);
      if (nowOnline) {
        // Refetch stale queries once connection returns
        queryClient.invalidateQueries();
      }
    });
  }, [queryClient]);

  if (online) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background px-6"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-9 w-9 text-muted-foreground" />
      </div>

      <div className="text-center">
        <p className="text-xl font-semibold">You&rsquo;re offline</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reconnect to continue using SHE WAWA.
        </p>
      </div>

      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="min-w-[120px]"
      >
        Retry
      </Button>
    </div>
  );
}
