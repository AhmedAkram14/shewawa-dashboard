"use client";

import { useFactoryOrders } from "../hooks/use-factory-orders";
import { FactoryOrderCard } from "./factory-order-card";

export function FactoryOrdersList() {
  const { data: orders = [], isLoading, error } = useFactoryOrders();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading factory orders…</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error
          ? error.message
          : "Failed to load factory orders."}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
        No factory orders yet. Use &quot;Proceed to Order&quot; on a listing in
        the decision stage to create one.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((fo) => (
        <FactoryOrderCard key={fo.id} fo={fo} />
      ))}
    </div>
  );
}
