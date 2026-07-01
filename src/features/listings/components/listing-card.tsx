import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
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
    <Link href={`/listings/${listing.id}`}>
      <Card className="hover:bg-accent/50 transition-colors">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium leading-tight">{listing.products.name}</p>
            <ListingStatusBadge status={listing.status as ListingStatus} />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {listing.collections && <span>{listing.collections.name}</span>}
            {isActive ? (
              <span className="text-foreground font-medium">
                {closesInLabel(listing.closes_on)}
              </span>
            ) : (
              <span>{formatDate(listing.closes_on)}</span>
            )}
            {listing.threshold && <span>Min: {listing.threshold} pcs</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
