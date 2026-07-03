"use client";

import Link from "next/link";
import {
  Banknote,
  CircleDot,
  CheckCircle2,
  Truck,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import type { MoneyReport, MoneyStatusBucket, OrderStatus } from "../api/money";

const STATUS_META: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; accent: string }
> = {
  pending: { label: "Pending", icon: CircleDot, accent: "text-yellow-500" },
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

function SideCard({
  title,
  rows,
  total,
  totalLabel,
  totalAccent,
}: {
  title: string;
  rows: { label: string; value: number; accent?: string }[];
  total: number;
  totalLabel: string;
  totalAccent?: string;
}) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="divide-y px-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between py-2.5"
          >
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className={`text-sm font-semibold ${row.accent ?? ""}`}>
              EGP {formatPrice(row.value)}
            </span>
          </div>
        ))}
      </div>
      <div
        className={`flex items-baseline justify-between rounded-b-xl px-4 py-3 ${totalAccent ?? "bg-muted/40"}`}
      >
        <span className="text-sm font-medium">{totalLabel}</span>
        <span className="text-base font-bold">EGP {formatPrice(total)}</span>
      </div>
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
            EGP {formatPrice(bucket.deposits)} paid
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
  const profitPositive = report.gross_profit_expected >= 0;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-semibold leading-tight">Money</h1>
        <p className="text-sm text-muted-foreground">
          {report.active_order_count} active order
          {report.active_order_count !== 1 ? "s" : ""} · live cash flow
        </p>
      </div>

      {/* ── Customer side ──────────────────────────────────────────────── */}
      <SideCard
        title="↓ Money In — Customers"
        rows={[
          {
            label: "Collected (deposits)",
            value: report.customer_collected,
            accent: "text-green-700",
          },
          {
            label: "Expected (balance due)",
            value: report.customer_outstanding,
            accent: "text-muted-foreground",
          },
        ]}
        total={report.customer_revenue}
        totalLabel="Total revenue"
        totalAccent="bg-green-50 text-green-900"
      />

      {/* ── Factory side ───────────────────────────────────────────────── */}
      <SideCard
        title="↑ Money Out — Factories"
        rows={[
          {
            label: "Paid to factories",
            value: report.factory_paid,
            accent: "text-green-700",
          },
          {
            label: "Still owed to factories",
            value: report.factory_outstanding,
            accent:
              report.factory_outstanding > 0
                ? "text-coral-dk"
                : "text-muted-foreground",
          },
        ]}
        total={report.factory_cost_agreed}
        totalLabel="Total factory cost"
        totalAccent="bg-red-50 text-red-900"
      />

      {report.factory_cost_lines_unknown > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warn-bg bg-warn-bg/60 px-3 py-2.5 text-xs text-warn-tx">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {report.factory_cost_lines_unknown} factory line
            {report.factory_cost_lines_unknown !== 1 ? "s are" : " is"} missing
            a unit cost — factory total is understated. Set costs on each
            factory order to get accurate figures.
          </span>
        </div>
      )}

      {/* ── Profit projection ──────────────────────────────────────────── */}
      <div
        className={`rounded-xl border p-4 shadow-sm ${
          profitPositive
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <TrendingUp
            className={`h-4 w-4 ${profitPositive ? "text-green-600" : "text-red-500"}`}
          />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Expected Gross Profit
          </p>
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <p
            className={`text-3xl font-bold leading-none ${
              profitPositive ? "text-green-800" : "text-red-700"
            }`}
          >
            EGP {formatPrice(Math.abs(report.gross_profit_expected))}
          </p>
          {!profitPositive && (
            <span className="text-sm font-medium text-red-600">loss</span>
          )}
          {report.gross_margin_pct != null && (
            <span
              className={`text-sm font-semibold ${
                profitPositive ? "text-green-700" : "text-red-600"
              }`}
            >
              {report.gross_margin_pct}%
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Revenue EGP {formatPrice(report.customer_revenue)} − Factory cost EGP{" "}
          {formatPrice(report.factory_cost_agreed)}
          {report.factory_cost_lines_unknown > 0 && " (partial)"}
        </p>
      </div>

      {/* ── Per-status pipeline ────────────────────────────────────────── */}
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

      {/* ── Per-order list ─────────────────────────────────────────────── */}
      {report.orders.length > 0 && (
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
      )}

      {report.active_order_count === 0 && (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Banknote className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-medium">No active orders</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an order to track financial exposure here.
          </p>
        </div>
      )}
    </div>
  );
}
