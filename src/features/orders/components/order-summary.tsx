"use client";

import { Badge } from "@/components/ui/badge";
import type { ListingWithRelations } from "@/features/listings/api/listings";
import { useOrdersByListing } from "../hooks/use-orders";

export function OrderSummary({ listing }: { listing: ListingWithRelations }) {
  const {
    data: orders = [],
    isLoading,
    error,
  } = useOrdersByListing(listing.id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading orders…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load orders."}
      </p>
    );
  }

  const active = orders.filter((o) => o.status === "active");
  const totalPieces = active.reduce((sum, o) => sum + o.quantity, 0);

  // Aggregate by variant
  const variantMap = new Map<
    string,
    { name: string; orderCount: number; totalQuantity: number }
  >();
  for (const order of active) {
    const v = order.product_variants;
    if (!variantMap.has(v.id)) {
      variantMap.set(v.id, { name: v.name, orderCount: 0, totalQuantity: 0 });
    }
    const entry = variantMap.get(v.id)!;
    entry.orderCount += 1;
    entry.totalQuantity += order.quantity;
  }

  const thresholdMet =
    listing.threshold !== null ? totalPieces >= listing.threshold : null;

  return (
    <div className="space-y-4">
      {/* Totals */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {active.length} {active.length === 1 ? "order" : "orders"} ·{" "}
            {totalPieces} pcs total
          </p>
          {orders.length > active.length && (
            <p className="text-xs text-muted-foreground">
              {orders.length - active.length} cancelled
            </p>
          )}
        </div>
        {thresholdMet !== null && (
          <Badge variant={thresholdMet ? "default" : "outline"}>
            {thresholdMet
              ? `Threshold met (${listing.threshold})`
              : `Below threshold (${listing.threshold})`}
          </Badge>
        )}
      </div>

      {/* Variant breakdown */}
      {variantMap.size > 0 && (
        <div className="rounded-md border divide-y text-sm">
          {Array.from(variantMap.entries()).map(([id, v]) => (
            <div
              key={id}
              className="flex items-center justify-between px-3 py-2"
            >
              <span className="text-muted-foreground">{v.name}</span>
              <span>
                {v.totalQuantity} pcs · {v.orderCount}{" "}
                {v.orderCount === 1 ? "order" : "orders"}
              </span>
            </div>
          ))}
        </div>
      )}

      {active.length === 0 && (
        <p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
          No active orders for this listing.
        </p>
      )}
    </div>
  );
}
