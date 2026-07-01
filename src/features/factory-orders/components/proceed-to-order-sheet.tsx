"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useDecisionListingsByFactory } from "../hooks/use-factory-orders";
import { useCreateFactoryOrder } from "../hooks/use-factory-order-mutations";
import { createFactoryOrderSchema } from "../schemas";
import type { ListingWithRelations } from "@/features/listings/api/listings";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function ProceedToOrderSheet({
  listing,
}: {
  listing: ListingWithRelations;
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([listing.id]);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const factoryId = listing.products.factory_id;

  const { data: otherListings = [], isLoading: loadingOthers } =
    useDecisionListingsByFactory(factoryId ?? "", listing.id);

  const createFactoryOrder = useCreateFactoryOrder();

  function toggleListing(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function reset() {
    setSelectedIds([listing.id]);
    setReference("");
    setNotes("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!factoryId) {
      setError(
        "This product has no factory assigned. Please assign a factory before proceeding.",
      );
      return;
    }

    const parsed = createFactoryOrderSchema.safeParse({
      factory_id: factoryId,
      listing_ids: selectedIds,
      reference: reference || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    try {
      await createFactoryOrder.mutateAsync(parsed.data);
      reset();
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create factory order",
      );
    }
  }

  // If no factory on product, render a disabled button with a tooltip-like message
  if (!factoryId) {
    return (
      <div className="space-y-2">
        <Button variant="default" size="sm" disabled className="w-full">
          Proceed to Order
        </Button>
        <p className="text-xs text-destructive">
          This product has no factory assigned. Set a factory on the product to
          proceed.
        </p>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="default" size="sm" className="w-full" />}
      >
        Proceed to Order
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Factory Order</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 px-4 pb-8">
          {/* Current listing — always selected */}
          <div className="space-y-2">
            <Label>Listings to bundle</Label>
            <div className="rounded-md border divide-y text-sm">
              {/* Current listing — fixed */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/40">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="h-4 w-4 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {listing.products.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This listing · closes {formatDate(listing.closes_on)}
                  </p>
                </div>
              </div>

              {/* Other ready listings from same factory */}
              {loadingOthers ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  Checking for other ready listings…
                </div>
              ) : otherListings.length === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  No other listings from this factory are ready.
                </div>
              ) : (
                otherListings.map((l) => (
                  <label
                    key={l.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent/50"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0"
                      checked={selectedIds.includes(l.id)}
                      onChange={() => toggleListing(l.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{l.products.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Closes {formatDate(l.closes_on)}
                        {l.threshold ? ` · Min ${l.threshold}` : ""}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedIds.length} listing
              {selectedIds.length !== 1 ? "s" : ""} selected
            </p>
          </div>

          <Separator />

          {/* PO reference */}
          <div className="space-y-2">
            <Label htmlFor="fo_reference">PO Reference (optional)</Label>
            <Input
              id="fo_reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-2026-001"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="fo_notes">Notes (optional)</Label>
            <Input
              id="fo_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for the factory…"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={createFactoryOrder.isPending}
              className="flex-1"
            >
              {createFactoryOrder.isPending
                ? "Creating…"
                : "Create Factory Order"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={createFactoryOrder.isPending}
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
