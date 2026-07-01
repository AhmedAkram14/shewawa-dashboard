import Link from "next/link";

import { DeliveryStatusBadge } from "./delivery-status-badge";
import type { DeliverySummary } from "../api/deliveries";
import type { DeliveryStatus } from "../schemas";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DeliveryCard({ delivery }: { delivery: DeliverySummary }) {
  return (
    <Link
      href={`/deliveries/${delivery.id}`}
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium truncate">{delivery.customers.name}</p>
        <p className="text-xs text-muted-foreground">
          {delivery.order_count} order{delivery.order_count !== 1 ? "s" : ""} ·{" "}
          {formatDate(delivery.created_at)}
        </p>
      </div>
      <div className="ml-3 shrink-0">
        <DeliveryStatusBadge status={delivery.status as DeliveryStatus} />
      </div>
    </Link>
  );
}
