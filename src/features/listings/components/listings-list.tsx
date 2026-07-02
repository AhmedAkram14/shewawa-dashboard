"use client";

import { useListings } from "../hooks/use-listings";
import { ListingCard } from "./listing-card";
import { CreateListingSheet } from "./create-listing-sheet";
import type { ListingSummary } from "../api/listings";
import type { ListingStatus } from "../schemas";

type Group = {
  label: string;
  statuses: ListingStatus[];
};

const GROUPS: Group[] = [
  { label: "Decision Required", statuses: ["decision"] },
  { label: "Collecting", statuses: ["collecting"] },
  {
    label: "In Progress",
    statuses: ["ordered", "receiving", "ready_for_packing"],
  },
  { label: "Completed", statuses: ["reconciled", "cancelled"] },
];

export function ListingsList() {
  const { data: listings = [], isLoading, error } = useListings();

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load listings."}
      </div>
    );
  }

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: listings.filter((l: ListingSummary) =>
      (g.statuses as string[]).includes(l.status),
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-tight">Listings</h1>
        <CreateListingSheet />
      </div>

      {grouped.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">
          No listings yet. Create one to get started.
        </p>
      )}

      {grouped.map((group) => (
        <section key={group.label} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h2>
          {group.items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      ))}
    </div>
  );
}
