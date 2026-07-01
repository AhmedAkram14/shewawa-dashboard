"use client";

import { useDeliveries } from "../hooks/use-deliveries";
import { DeliveryCard } from "./delivery-card";
import { CreateDeliverySheet } from "./create-delivery-sheet";

export function DeliveriesList() {
  const { data: deliveries = [], isLoading, error } = useDeliveries();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Deliveries</h1>
        <CreateDeliverySheet />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading deliveries…</p>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load deliveries."}
        </p>
      )}

      {!isLoading && !error && deliveries.length === 0 && (
        <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
          No deliveries yet. Create one when listings are ready for packing.
        </p>
      )}

      {deliveries.map((d) => (
        <DeliveryCard key={d.id} delivery={d} />
      ))}
    </div>
  );
}
