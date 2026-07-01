import Link from "next/link";

import type { PackingCustomer } from "@/features/deliveries/api/deliveries";
import { TodaySection } from "./today-section";

export function ReadyPackingSection({
  customers,
}: {
  customers: PackingCustomer[];
}) {
  return (
    <TodaySection
      title="Ready for Packing"
      count={customers.length}
      emptyText="No orders ready to pack."
    >
      <div className="space-y-1 px-4">
        {customers.map(({ customer, orders }) => (
          <Link
            key={customer.id}
            href="/deliveries"
            className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-accent active:bg-accent/80"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{customer.name}</p>
              {customer.phone && (
                <p className="text-xs text-muted-foreground">
                  {customer.phone}
                </p>
              )}
            </div>
            <span className="ml-3 shrink-0 text-xs text-muted-foreground">
              {orders.length} item{orders.length !== 1 ? "s" : ""}
            </span>
          </Link>
        ))}
      </div>
    </TodaySection>
  );
}
