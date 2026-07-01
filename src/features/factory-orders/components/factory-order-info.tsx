"use client";

import Link from "next/link";

import { useFactoryOrder } from "../hooks/use-factory-orders";
import { FactoryOrderStatusBadge } from "./factory-order-status-badge";
import type { FactoryOrderStatus } from "../schemas";

export function FactoryOrderInfo({
  factoryOrderId,
}: {
  factoryOrderId: string;
}) {
  const { data: fo } = useFactoryOrder(factoryOrderId);

  return (
    <div className="space-y-2">
      {fo && (
        <div className="rounded-md border p-3 space-y-1.5 text-sm">
          <p className="font-medium">{fo.factories.name}</p>
          {fo.reference && (
            <p className="text-muted-foreground">Ref: {fo.reference}</p>
          )}
          <FactoryOrderStatusBadge status={fo.status as FactoryOrderStatus} />
        </div>
      )}
      <Link
        href={`/factory-orders/${factoryOrderId}`}
        className="text-sm text-primary hover:underline"
      >
        View Factory Order →
      </Link>
    </div>
  );
}
