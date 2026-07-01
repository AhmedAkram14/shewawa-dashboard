"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTransitionListingStatus } from "../hooks/use-listing-mutations";
import { ProceedToOrderSheet } from "@/features/factory-orders/components/proceed-to-order-sheet";
import type { ListingWithRelations } from "../api/listings";
import type { ListingStatus, ListingAction } from "../schemas";

type ActionConfig = {
  action: ListingAction;
  label: string;
  variant?: "default" | "destructive" | "outline";
};

const ACTIONS: Partial<Record<ListingStatus, ActionConfig[]>> = {
  collecting: [
    { action: "end_collecting", label: "End Collecting", variant: "outline" },
  ],
  decision: [
    { action: "extend", label: "Extend Closing Date", variant: "outline" },
    { action: "cancel", label: "Cancel Listing", variant: "destructive" },
  ],
  ordered: [
    {
      action: "mark_receiving",
      label: "Mark as Receiving",
      variant: "default",
    },
  ],
  receiving: [
    {
      action: "mark_ready_for_packing",
      label: "Mark as Ready for Packing",
      variant: "default",
    },
  ],
  ready_for_packing: [
    {
      action: "mark_reconciled",
      label: "Mark as Reconciled",
      variant: "default",
    },
  ],
};

export function ListingActions({ listing }: { listing: ListingWithRelations }) {
  const [showExtend, setShowExtend] = useState(false);
  const [newClosesOn, setNewClosesOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  const transition = useTransitionListingStatus();

  const actions = ACTIONS[listing.status];
  if (!actions || actions.length === 0) return null;

  async function handleAction(action: ListingAction) {
    setError(null);

    if (action === "extend") {
      setShowExtend(true);
      return;
    }

    try {
      await transition.mutateAsync({ id: listing.id, action });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  async function handleExtend() {
    if (!newClosesOn) return;
    setError(null);

    try {
      await transition.mutateAsync({
        id: listing.id,
        action: "extend",
        closes_on: new Date(newClosesOn).toISOString(),
      });
      setShowExtend(false);
      setNewClosesOn("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extend failed");
    }
  }

  return (
    <div className="space-y-3">
      <Separator />

      {showExtend ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new_closes_on">New closing date</Label>
            <Input
              id="new_closes_on"
              type="datetime-local"
              value={newClosesOn}
              onChange={(e) => setNewClosesOn(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleExtend}
              disabled={!newClosesOn || transition.isPending}
            >
              {transition.isPending ? "Extending…" : "Confirm Extension"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowExtend(false);
                setNewClosesOn("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {listing.status === "decision" && (
            <ProceedToOrderSheet listing={listing} />
          )}
          {actions.map((a) => (
            <Button
              key={a.action}
              variant={a.variant ?? "default"}
              onClick={() => handleAction(a.action)}
              disabled={transition.isPending}
              size="sm"
            >
              {a.label}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
