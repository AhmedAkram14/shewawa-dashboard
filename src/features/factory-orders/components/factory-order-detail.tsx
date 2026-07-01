"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFactoryOrder } from "../hooks/use-factory-orders";
import { usePlaceFactoryOrder } from "../hooks/use-factory-order-mutations";
import { FactoryOrderStatusBadge } from "./factory-order-status-badge";
import { FactoryOrderLinesTable } from "./factory-order-lines-table";
import type { FactoryOrderStatus } from "../schemas";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function FactoryOrderDetail({ id }: { id: string }) {
  const { data: fo, isLoading, error } = useFactoryOrder(id);
  const place = usePlaceFactoryOrder();

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error || !fo) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : "Factory order not found."}
      </div>
    );
  }

  const uniqueListingIds = [
    ...new Set(fo.factory_order_lines.map((l) => l.listing_id)),
  ];

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      <Link
        href="/factory-orders"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Factory Orders
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{fo.factories.name}</h1>
        <div className="flex items-center gap-2">
          <FactoryOrderStatusBadge status={fo.status as FactoryOrderStatus} />
          {fo.reference && (
            <span className="text-sm text-muted-foreground">
              Ref: {fo.reference}
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Lines */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Order Lines</h2>
        <FactoryOrderLinesTable lines={fo.factory_order_lines} />
      </div>

      <Separator />

      {/* Metadata */}
      <div className="space-y-2">
        {fo.factories.contact && (
          <MetaRow label="Factory contact" value={fo.factories.contact} />
        )}
        {fo.placed_at && (
          <MetaRow label="Placed on" value={formatDate(fo.placed_at)} />
        )}
        <MetaRow label="Created" value={formatDate(fo.created_at)} />
        {fo.notes && <MetaRow label="Notes" value={fo.notes} />}
      </div>

      {/* Linked listings */}
      {uniqueListingIds.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">
              Linked Listings ({uniqueListingIds.length})
            </h2>
            <div className="space-y-1">
              {[
                ...new Map(
                  fo.factory_order_lines.map((l) => [l.listing_id, l.listings]),
                ).entries(),
              ].map(([listingId, listing]) => (
                <Link
                  key={listingId}
                  href={`/listings/${listingId}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                >
                  <span>{listing.products.name}</span>
                  <span className="text-muted-foreground">→</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Action */}
      {fo.status === "draft" && (
        <>
          <Separator />
          <Button
            className="w-full"
            disabled={place.isPending}
            onClick={() => place.mutate(id)}
          >
            {place.isPending ? "Placing…" : "Place Order"}
          </Button>
        </>
      )}
    </div>
  );
}
