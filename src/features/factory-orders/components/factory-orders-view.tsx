"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

import { useFactoryOrders } from "../hooks/use-factory-orders";
import type {
  FactoryOrderWithFactory,
  FactoryOrderRow,
} from "../api/factory-orders";
import { FactoryOrderStatusBadge } from "./factory-order-status-badge";

type FOStatus = FactoryOrderRow["status"];
type Filter = "all" | FOStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
];

interface Props {
  initialData: FactoryOrderWithFactory[];
}

export function FactoryOrdersView({ initialData }: Props) {
  const router = useRouter();
  const { data: orders = [] } = useFactoryOrders(initialData);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const countFor = (key: Filter) =>
    key === "all"
      ? orders.length
      : orders.filter((o) => o.status === key).length;

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="flex-1 text-2xl font-semibold leading-tight">
          Factory Orders
        </h1>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/factory-orders/new" />}
        >
          <Plus />
          New
        </Button>
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
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
        <div className="py-16 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            {filter === "all"
              ? "No factory orders yet"
              : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} factory orders`}
          </p>
          {filter === "all" && (
            <Button
              nativeButton={false}
              render={<Link href="/factory-orders/new" />}
            >
              Send to factory
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((fo) => {
            const pcs = fo.factory_order_lines.reduce(
              (sum, l) => sum + l.quantity,
              0,
            );
            const allCostsKnown =
              fo.factory_order_lines.length > 0 &&
              fo.factory_order_lines.every((l) => l.unit_cost != null);
            const totalCost = allCostsKnown
              ? fo.factory_order_lines.reduce(
                  (sum, l) => sum + l.quantity * (l.unit_cost ?? 0),
                  0,
                )
              : null;
            const date = new Date(fo.created_at).toLocaleDateString("en-EG", {
              day: "numeric",
              month: "short",
            });
            return (
              <li key={fo.id}>
                <Link
                  href={`/factory-orders/${fo.id}`}
                  className="block rounded-xl border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm active:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold leading-snug">
                        #{fo.factory_order_number} — {fo.factories.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {date}
                      </p>
                    </div>
                    <FactoryOrderStatusBadge status={fo.status} />
                  </div>
                  {pcs > 0 && (
                    <div className="mt-3 flex items-center gap-3 border-t pt-3 text-sm text-muted-foreground">
                      <span>{pcs} pcs</span>
                      {totalCost != null ? (
                        <span>EGP {formatPrice(totalCost)}</span>
                      ) : (
                        <span className="text-xs italic">cost not set</span>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
