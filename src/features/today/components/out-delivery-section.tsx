import Link from "next/link";

import type { DeliverySummary } from "@/features/deliveries/api/deliveries";
import { TodaySection } from "./today-section";

export function OutDeliverySection({
  deliveries,
}: {
  deliveries: DeliverySummary[];
}) {
  return (
    <TodaySection
      title="Out for Delivery"
      count={deliveries.length}
      emptyText="No deliveries out right now."
    >
      <div className="space-y-1 px-4">
        {deliveries.map((d) => (
          <Link
            key={d.id}
            href={`/deliveries/${d.id}`}
            className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-accent active:bg-accent/80"
          >
            <p className="truncate text-sm font-medium">{d.customers.name}</p>
            <span className="ml-3 shrink-0 text-xs text-muted-foreground">
              {d.order_count} order{d.order_count !== 1 ? "s" : ""}
            </span>
          </Link>
        ))}
      </div>
    </TodaySection>
  );
}
