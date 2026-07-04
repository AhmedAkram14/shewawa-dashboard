"use client";

import Link from "next/link";
import { ArrowLeft, PackageCheck, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DeliveryWithOrderCount } from "../api/deliveries";
import { useDeliveries } from "../hooks/use-deliveries";
import { DeliveryStatusBadge } from "./delivery-status-badge";
import { NewDeliverySheet } from "./new-delivery-sheet";

type DeliveryStatus = "pending" | "dispatched" | "completed";
type Filter = "all" | DeliveryStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "dispatched", label: "Dispatched" },
  { key: "completed", label: "Completed" },
];

interface Props {
  initialData: DeliveryWithOrderCount[];
}

export function DeliveriesView({ initialData }: Props) {
  const router = useRouter();
  const { data: deliveries = [] } = useDeliveries(initialData);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? deliveries
      : deliveries.filter((d) => d.status === filter);

  const countFor = (key: Filter) =>
    key === "all"
      ? deliveries.length
      : deliveries.filter((d) => d.status === key).length;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-24">
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

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count = countFor(f.key);
          if (f.key !== "all" && count === 0) return null;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-coral text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {f.label}
              {f.key !== "all" && (
                <span className="ml-1 opacity-70">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <PackageCheck className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {deliveries.length === 0
              ? "No deliveries yet. Create one from ready orders."
              : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} deliveries`}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((d) => (
            <DeliveryCard key={d.id} delivery={d} />
          ))}
        </ul>
      )}

      <NewDeliverySheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

function DeliveryCard({ delivery }: { delivery: DeliveryWithOrderCount }) {
  const orderCount = delivery.orders.length;
  const customerNames = delivery.orders
    .map((o) => o.customers?.name)
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
        className="block rounded-xl border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm active:bg-accent"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold leading-snug">
            Delivery #{delivery.delivery_number}
          </p>
          <DeliveryStatusBadge status={delivery.status} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 text-sm">
          <span className="truncate text-muted-foreground">
            {customerNames || "—"}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {date} · {orderCount} order{orderCount !== 1 ? "s" : ""}
          </span>
        </div>
      </Link>
    </li>
  );
}
