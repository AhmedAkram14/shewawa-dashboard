"use client";

import Link from "next/link";
import { Banknote, CircleDot, CheckCircle2, Truck } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import type { MoneyReport, MoneyStatusBucket, OrderStatus } from "../api/money";

const STATUS_META: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; accent: string }
> = {
  pending: {
    label: "Pending",
    icon: CircleDot,
    accent: "text-yellow-500",
  },
  ready: {
    label: "Ready for delivery",
    icon: CheckCircle2,
    accent: "text-blue-500",
  },
  out_for_delivery: {
    label: "Out for delivery",
    icon: Truck,
    accent: "text-orange-500",
  },
};

const STATUS_ORDER: OrderStatus[] = ["pending", "ready", "out_for_delivery"];

function KpiTile({
  label,
  value,
  sub,
  accent = "text-muted-foreground/60",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Banknote className={`h-4 w-4 ${accent}`} />
      </div>
      <p className="text-2xl font-bold leading-none tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function StatusRow({
  status,
  bucket,
}: {
  status: OrderStatus;
  bucket: MoneyStatusBucket;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className={`h-4 w-4 shrink-0 ${meta.accent}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium">
            {meta.label}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({bucket.order_count} order{bucket.order_count !== 1 ? "s" : ""})
            </span>
          </span>
          <span className="shrink-0 text-sm font-semibold">
            EGP {formatPrice(bucket.value)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            EGP {formatPrice(bucket.deposits)} deposited
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            EGP {formatPrice(bucket.balance)} due
          </span>
        </div>
      </div>
    </div>
  );
}

export function MoneyView({ report }: { report: MoneyReport }) {
  const activeStatuses = STATUS_ORDER.filter((s) => report.by_status[s]);

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-semibold leading-tight">Money</h1>
        <p className="text-sm text-muted-foreground">
          {report.active_order_count} active order
          {report.active_order_count !== 1 ? "s" : ""} · live exposure
        </p>
      </div>

      {report.active_order_count === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Banknote className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-medium">No active orders</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an order to track financial exposure here.
          </p>
        </div>
      ) : (
        <>
          {/* Top KPIs */}
          <section className="grid grid-cols-1 gap-3">
            <KpiTile
              label="Total Active Value"
              value={`EGP ${formatPrice(report.total_active_value)}`}
              sub="gross value of all active orders"
              accent="text-muted-foreground/60"
            />
            <div className="grid grid-cols-2 gap-3">
              <KpiTile
                label="Deposits Collected"
                value={`EGP ${formatPrice(report.deposits_collected)}`}
                sub="paid so far"
                accent="text-green-500"
              />
              <KpiTile
                label="Outstanding"
                value={`EGP ${formatPrice(report.outstanding_balance)}`}
                sub="still owed"
                accent="text-coral"
              />
            </div>
          </section>

          {/* Pipeline breakdown */}
          {activeStatuses.length > 0 && (
            <section>
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pipeline Breakdown
              </h2>
              <div className="divide-y rounded-xl border bg-card px-4">
                {activeStatuses.map((status) => (
                  <StatusRow
                    key={status}
                    status={status}
                    bucket={report.by_status[status]!}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Per-order list */}
          <section>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Orders
            </h2>
            <ul className="divide-y rounded-xl border bg-card">
              {report.orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent active:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          #{order.order_number}
                        </span>
                        <span className="truncate text-sm">
                          {order.customer_name}
                        </span>
                        <span className="ml-auto shrink-0">
                          <OrderStatusBadge status={order.status} />
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          EGP {formatPrice(order.order_value)} total · EGP{" "}
                          {formatPrice(order.deposit_amount)} paid
                        </span>
                        {order.balance_due > 0 && (
                          <span className="shrink-0 font-medium text-foreground">
                            EGP {formatPrice(order.balance_due)} due
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
