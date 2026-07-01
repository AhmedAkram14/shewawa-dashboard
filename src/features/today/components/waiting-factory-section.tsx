import Link from "next/link";

import type { FactoryOrderSummary } from "@/features/factory-orders/api/factory-orders";
import { TodaySection } from "./today-section";

export function WaitingFactorySection({
  orders,
}: {
  orders: FactoryOrderSummary[];
}) {
  return (
    <TodaySection
      title="Waiting for Factory"
      count={orders.length}
      emptyText="No factory orders pending."
    >
      <div className="space-y-1 px-4">
        {orders.map((fo) => (
          <Link
            key={fo.id}
            href={`/factory-orders/${fo.id}`}
            className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-accent active:bg-accent/80"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {fo.reference ?? `Order #${fo.id.slice(0, 8)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {fo.factories.name}
              </p>
            </div>
            <span className="ml-3 shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
              Placed
            </span>
          </Link>
        ))}
      </div>
    </TodaySection>
  );
}
