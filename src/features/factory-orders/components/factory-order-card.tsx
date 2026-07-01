import Link from "next/link";

import { FactoryOrderStatusBadge } from "./factory-order-status-badge";
import type { FactoryOrderSummary } from "../api/factory-orders";
import type { FactoryOrderStatus } from "../schemas";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FactoryOrderCard({ fo }: { fo: FactoryOrderSummary }) {
  return (
    <Link
      href={`/factory-orders/${fo.id}`}
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium truncate">{fo.factories.name}</p>
        <p className="text-xs text-muted-foreground">
          {fo.reference ? `Ref: ${fo.reference} · ` : ""}
          Created {formatDate(fo.created_at)}
        </p>
      </div>
      <div className="ml-3 shrink-0">
        <FactoryOrderStatusBadge status={fo.status as FactoryOrderStatus} />
      </div>
    </Link>
  );
}
