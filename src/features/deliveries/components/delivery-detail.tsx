"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDelivery } from "../hooks/use-deliveries";
import { useUpdateDeliveryStatus } from "../hooks/use-delivery-mutations";
import { DeliveryStatusBadge } from "./delivery-status-badge";
import type { DeliveryStatus } from "../schemas";

function formatPrice(piastres: number) {
  return `EGP ${(piastres / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const TERMINAL: DeliveryStatus[] = ["delivered", "refused", "failed"];

export function DeliveryDetail({ id }: { id: string }) {
  const { data: delivery, isLoading, error } = useDelivery(id);
  const updateStatus = useUpdateDeliveryStatus();

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error || !delivery) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : "Delivery not found."}
      </div>
    );
  }

  const isTerminal = TERMINAL.includes(delivery.status as DeliveryStatus);

  const orderTotal = delivery.delivery_orders.reduce((sum, do_) => {
    return sum + do_.orders.quantity * do_.orders.unit_price;
  }, 0);

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      <Link
        href="/deliveries"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Deliveries
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{delivery.customers.name}</h1>
        <div className="flex items-center gap-2">
          <DeliveryStatusBadge status={delivery.status as DeliveryStatus} />
          {delivery.customers.phone && (
            <span className="text-sm text-muted-foreground">
              {delivery.customers.phone}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {delivery.customers.address}
        </p>
      </div>

      <Separator />

      {/* Orders */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">
          Orders ({delivery.delivery_orders.length})
        </h2>
        <div className="rounded-md border divide-y text-sm">
          {delivery.delivery_orders.map((do_) => (
            <div key={do_.id} className="px-3 py-2.5 space-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {do_.orders.listings.products.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {do_.orders.product_variants.name} · {do_.orders.quantity}{" "}
                    pcs
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium">
                  {formatPrice(do_.orders.unit_price * do_.orders.quantity)}
                </span>
              </div>
              {do_.orders.notes && (
                <p className="text-xs text-muted-foreground italic">
                  {do_.orders.notes}
                </p>
              )}
              <Link
                href={`/listings/${do_.orders.listing_id}`}
                className="text-xs text-primary hover:underline"
              >
                View listing →
              </Link>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-medium px-1">
          <span>Total</span>
          <span>{formatPrice(orderTotal)}</span>
        </div>
      </div>

      {/* Notes */}
      {delivery.notes && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Notes
            </p>
            <p className="text-sm">{delivery.notes}</p>
          </div>
        </>
      )}

      <Separator />

      {/* Metadata */}
      <p className="text-xs text-muted-foreground">
        Created {formatDate(delivery.created_at)}
      </p>

      {/* Actions */}
      {!isTerminal && (
        <>
          {updateStatus.error && (
            <p className="text-sm text-destructive" role="alert">
              {(updateStatus.error as { message?: string })?.message ??
                "Failed to update status."}
            </p>
          )}

          {delivery.status === "pending" && (
            <Button
              className="w-full"
              disabled={updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate({ id, status: "out_for_delivery" })
              }
            >
              {updateStatus.isPending
                ? "Updating…"
                : "Mark as Out for Delivery"}
            </Button>
          )}

          {delivery.status === "out_for_delivery" && (
            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id, status: "delivered" })}
              >
                {updateStatus.isPending ? "Updating…" : "Mark as Delivered"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id, status: "refused" })}
              >
                Mark as Refused
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id, status: "failed" })}
              >
                Mark as Failed
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
