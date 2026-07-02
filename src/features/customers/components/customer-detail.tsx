"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCustomer } from "../hooks/use-customers";
import { computeCustomerInsights } from "../api/customers";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(piastres: number) {
  return `EGP ${(piastres / 100).toFixed(2)}`;
}

function InsightChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

export function CustomerDetail({ id }: { id: string }) {
  const { data: customer, isLoading, error } = useCustomer(id);

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error || !customer) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : "Customer not found."}
      </div>
    );
  }

  const insights = computeCustomerInsights(customer);
  const activeOrders = customer.orders.filter((o) => o.status === "active");
  const cancelledOrders = customer.orders.filter(
    (o) => o.status === "cancelled",
  );

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      <Link
        href="/customers"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Customers
      </Link>

      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold leading-tight">
          {customer.name}
        </h1>
        <p className="text-sm text-muted-foreground">{customer.address}</p>
        {customer.phone && (
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
        )}
        {customer.notes && (
          <p className="text-sm text-muted-foreground italic">
            {customer.notes}
          </p>
        )}
      </div>

      <Separator />

      {/* Insights strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <InsightChip
          label="Total Orders"
          value={String(insights.totalOrders)}
        />
        <InsightChip
          label="Last Order"
          value={
            insights.lastOrder ? formatDate(insights.lastOrder.created_at) : "—"
          }
        />
        <InsightChip
          label="Refused Deliveries"
          value={String(insights.refusedDeliveries)}
        />
        <InsightChip
          label="Preferred Variant"
          value={insights.preferredVariant ?? "—"}
        />
      </div>

      <Separator />

      {/* Active orders */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">
          Active Orders ({activeOrders.length})
        </h2>
        {activeOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active orders.</p>
        ) : (
          <div className="rounded-md border divide-y text-sm">
            {activeOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-start justify-between gap-2 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {o.listings.products.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.product_variants.name} · {o.quantity} pcs ·{" "}
                    {formatDate(o.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-medium">
                    {formatPrice(o.unit_price * o.quantity)}
                  </span>
                  <Link
                    href={`/listings/${o.listing_id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancelled orders */}
      {cancelledOrders.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Cancelled Orders ({cancelledOrders.length})
          </h2>
          <div className="rounded-md border divide-y text-sm">
            {cancelledOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between px-3 py-2.5 opacity-60"
              >
                <div className="min-w-0">
                  <p className="truncate">{o.listings.products.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.product_variants.name} · {formatDate(o.created_at)}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 ml-2">
                  Cancelled
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
