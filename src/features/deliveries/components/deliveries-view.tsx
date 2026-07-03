"use client";

import Link from "next/link";
import { ArrowLeft, Plus, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import type { DeliveryWithOrderCount } from "../api/deliveries";
import { useDeliveries } from "../hooks/use-deliveries";
import { DeliveryStatusBadge } from "./delivery-status-badge";
import { NewDeliverySheet } from "./new-delivery-sheet";

interface Props {
  initialData: DeliveryWithOrderCount[];
}

export function DeliveriesView({ initialData }: Props) {
  const router = useRouter();
  const { data: deliveries = [] } = useDeliveries(initialData);
  const [sheetOpen, setSheetOpen] = useState(false);

  const active = deliveries.filter(
    (d) => d.status === "pending" || d.status === "dispatched",
  );
  const completed = deliveries.filter((d) => d.status === "completed");

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="flex-1 text-2xl font-semibold leading-tight">
          Deliveries
        </h1>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New
        </Button>
      </div>

      {deliveries.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <PackageCheck className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No deliveries yet. Create one from ready orders.
          </p>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active
          </p>
          <ul className="divide-y rounded-lg border">
            {active.map((d) => (
              <DeliveryRow key={d.id} delivery={d} />
            ))}
          </ul>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Completed
          </p>
          <ul className="divide-y rounded-lg border">
            {completed.map((d) => (
              <DeliveryRow key={d.id} delivery={d} />
            ))}
          </ul>
        </section>
      )}

      <NewDeliverySheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

function DeliveryRow({ delivery }: { delivery: DeliveryWithOrderCount }) {
  const orderCount = delivery.orders.length;
  const customerNames = delivery.orders
    .map((o) => o.customers.name)
    .filter(Boolean)
    .join(", ");
  const date = new Date(delivery.created_at).toLocaleDateString("en-EG", {
    day: "numeric",
    month: "short",
  });

  return (
    <li>
      <Link
        href={`/deliveries/${delivery.id}`}
        className="block p-3 hover:bg-muted/40"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold">
            Delivery #{delivery.delivery_number}
          </span>
          <DeliveryStatusBadge status={delivery.status} />
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          {customerNames && <span className="truncate">{customerNames}</span>}
          <span className="ml-auto shrink-0 text-xs">
            {date} · {orderCount} order{orderCount !== 1 ? "s" : ""}
          </span>
        </div>
      </Link>
    </li>
  );
}
