"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

import { useOrders } from "../hooks/use-orders";
import type { OrderWithCustomer, OrderRow } from "../api/orders";
import { OrderStatusBadge } from "./order-status-badge";

type OrderStatus = OrderRow["status"];
type Filter = "all" | OrderStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "delivery_failed", label: "Delivery Failed" },
  { key: "refused", label: "Refused" },
  { key: "cancelled", label: "Cancelled" },
];

interface Props {
  initialData: OrderWithCustomer[];
}

function orderTotals(order: OrderWithCustomer) {
  const total = order.order_lines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price,
    0,
  );
  const pcs = order.order_lines.reduce((sum, l) => sum + l.quantity, 0);
  const balanceDue = Math.max(0, total - order.deposit_amount);
  return { total, pcs, balanceDue };
}

export function OrdersView({ initialData }: Props) {
  const { data: orders = [] } = useOrders(initialData);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const countFor = (key: Filter) =>
    key === "all"
      ? orders.length
      : orders.filter((o) => o.status === key).length;

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-semibold leading-tight">Orders</h1>

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
          <p className="text-sm text-muted-foreground">
            {filter === "all"
              ? "No orders yet"
              : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} orders`}
          </p>
          {filter === "all" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Tap + to create your first order
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((order) => {
            const { total, pcs, balanceDue } = orderTotals(order);
            const date = new Date(order.created_at).toLocaleDateString(
              "en-EG",
              { day: "numeric", month: "short" },
            );
            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-xl border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm active:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold leading-snug">
                        #{order.order_number} — {order.customers.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {date}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  {pcs > 0 && (
                    <div className="mt-3 flex items-center gap-3 border-t pt-3 text-sm">
                      <span className="text-muted-foreground">{pcs} pcs</span>
                      <span className="text-muted-foreground">
                        EGP {formatPrice(total)}
                      </span>
                      {balanceDue > 0 ? (
                        <span className="ml-auto font-semibold text-coral-dk">
                          EGP {formatPrice(balanceDue)} due
                        </span>
                      ) : (
                        <span className="ml-auto text-xs text-success-tx">
                          Paid in full
                        </span>
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
