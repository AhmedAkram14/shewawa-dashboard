import Link from "next/link";

import type { ListingSummary } from "../api/listings";
import { ListingStatusBadge } from "./listing-status-badge";
import type { ListingStatus } from "../schemas";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function closesInLabel(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  return `Closes in ${days}d`;
}

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const isActive = listing.status === "collecting";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex items-start justify-between gap-3 bg-card px-4 py-4 transition-colors hover:bg-accent/50 active:bg-accent/70"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-medium leading-tight">
          {listing.products.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          {listing.collections && <span>{listing.collections.name}</span>}
          {listing.collections && <span>·</span>}
          {isActive ? (
            <span className="font-medium text-foreground">
              {closesInLabel(listing.closes_on)}
            </span>
          ) : (
            <span>{formatDate(listing.closes_on)}</span>
          )}
          {listing.threshold && (
            <>
              <span>·</span>
              <span>Min {listing.threshold} pcs</span>
            </>
          )}
        </div>
      </div>
      <ListingStatusBadge status={listing.status as ListingStatus} />
    </Link>
  );
}
