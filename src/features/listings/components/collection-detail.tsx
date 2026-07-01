"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCollection } from "../hooks/use-collections";
import type { ListingStatus } from "../schemas";

const STATUS_LABELS: Partial<Record<ListingStatus, string>> = {
  collecting: "Collecting",
  decision: "Decision",
  ordered: "Ordered",
  receiving: "Receiving",
  ready_for_packing: "Ready",
  reconciled: "Reconciled",
  cancelled: "Cancelled",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CollectionDetail({ id }: { id: string }) {
  const { data: collection, isLoading, error } = useCollection(id);

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error || !collection) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : "Collection not found."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      <Link
        href="/collections"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Collections
      </Link>

      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold">{collection.name}</h1>
        <p className="text-sm text-muted-foreground">
          {collection.listings.length} listing
          {collection.listings.length !== 1 ? "s" : ""}
        </p>
      </div>

      <Separator />

      {collection.listings.length === 0 ? (
        <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
          No listings in this collection yet.
        </p>
      ) : (
        <div className="space-y-2">
          {collection.listings.map((l) => (
            <Link
              key={l.id}
              href={`/listings/${l.id}`}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium truncate">{l.products.name}</p>
                <p className="text-xs text-muted-foreground">
                  Closes {formatDate(l.closes_on)}
                </p>
              </div>
              <Badge variant="outline" className="ml-3 shrink-0">
                {STATUS_LABELS[l.status as ListingStatus] ?? l.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
