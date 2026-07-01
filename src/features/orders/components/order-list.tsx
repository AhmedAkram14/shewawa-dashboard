"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ListingWithRelations } from "@/features/listings/api/listings";
import { useOrdersByListing } from "../hooks/use-orders";
import { useCancelOrder } from "../hooks/use-order-mutations";
import type { OrderWithRelations } from "../api/orders";
import { AddOrderSheet } from "./add-order-sheet";

function formatPrice(piastres: number) {
  return `EGP ${(piastres / 100).toFixed(2)}`;
}

function OrderRow({
  order,
  canCancel,
  onCancel,
  isCancelling,
}: {
  order: OrderWithRelations;
  canCancel: boolean;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const isCancelled = order.status === "cancelled";

  return (
    <div
      className={`flex items-start justify-between gap-3 py-3 border-b last:border-0 ${isCancelled ? "opacity-50" : ""}`}
    >
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium truncate">{order.customers.name}</p>
        <p className="text-sm text-muted-foreground">
          {order.product_variants.name} × {order.quantity}
        </p>
        {order.notes && (
          <p className="text-xs text-muted-foreground">{order.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isCancelled ? (
          <Badge variant="outline" className="text-xs">
            Cancelled
          </Badge>
        ) : (
          <>
            <span className="text-sm">
              {formatPrice(order.unit_price * order.quantity)}
            </span>
            {canCancel && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive h-7 px-2 text-xs"
                onClick={onCancel}
                disabled={isCancelling}
              >
                Cancel
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function OrderList({ listing }: { listing: ListingWithRelations }) {
  const {
    data: orders = [],
    isLoading,
    error,
  } = useOrdersByListing(listing.id);
  const cancel = useCancelOrder(listing.id);

  const canCancel = listing.status === "collecting";

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

  const activeOrders = orders.filter((o) => o.status === "active");
  const totalPieces = activeOrders.reduce((sum, o) => sum + o.quantity, 0);
  const thresholdGap =
    listing.threshold !== null
      ? Math.max(0, listing.threshold - totalPieces)
      : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activeOrders.length} {activeOrders.length === 1 ? "order" : "orders"}{" "}
          · {totalPieces} pcs
          {thresholdGap !== null &&
            (thresholdGap === 0 ? (
              <span className="text-green-600"> · Threshold met</span>
            ) : (
              <span> · {thresholdGap} more to threshold</span>
            ))}
        </p>
        {canCancel && <AddOrderSheet listing={listing} />}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
          No orders yet. Add the first one.
        </p>
      ) : (
        <div className="rounded-md border px-3">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              canCancel={canCancel}
              onCancel={() => cancel.mutate(order.id)}
              isCancelling={cancel.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
