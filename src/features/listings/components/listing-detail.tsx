"use client";

import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { useListing } from "../hooks/use-listings";
import { ListingStatusBadge } from "./listing-status-badge";
import { ListingStageView } from "./listing-stage-view";
import { ListingActions } from "./listing-actions";
import type { ListingStatus } from "../schemas";

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

export function ListingDetail({ id }: { id: string }) {
  const { data: listing, isLoading, error } = useListing(id);

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error || !listing) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : "Listing not found."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      {/* Back — plain Link styled inline to avoid asChild on @base-ui Button */}
      <Link
        href="/listings"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Listings
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold leading-tight">
          {listing.products.name}
        </h1>
        <ListingStatusBadge status={listing.status as ListingStatus} />
      </div>

      <Separator />

      {/* Stage-driven content */}
      <ListingStageView listing={listing} />

      <Separator />

      {/* Metadata */}
      <div className="space-y-2">
        <MetaRow label="Closes on" value={formatDate(listing.closes_on)} />
        {listing.threshold && (
          <MetaRow
            label="Min. threshold"
            value={`${listing.threshold} orders`}
          />
        )}
        {listing.collections && (
          <MetaRow label="Collection" value={listing.collections.name} />
        )}
        <MetaRow label="Created" value={formatDate(listing.created_at)} />
      </div>

      {/* Transition actions */}
      <ListingActions listing={listing} />
    </div>
  );
}
