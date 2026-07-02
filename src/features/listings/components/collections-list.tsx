"use client";

import { useState } from "react";
import Link from "next/link";

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
import { useCollections } from "../hooks/use-collections";
import { useCreateCollection } from "../hooks/use-collection-mutations";
import type { CollectionRow } from "@/lib/supabase/database.types";

function CollectionCard({ collection }: { collection: CollectionRow }) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
    >
      <p className="font-medium truncate">{collection.name}</p>
      <span className="ml-3 text-muted-foreground shrink-0">→</span>
    </Link>
  );
}

function NewCollectionSheet() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateCollection();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({ name: name.trim() });
      setName("");
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create collection",
      );
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>
        + New Collection
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>New Collection</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 px-4 pb-8">
          <div className="space-y-2">
            <Label htmlFor="col_name">Name</Label>
            <Input
              id="col_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer 2026"
              maxLength={100}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={create.isPending} className="w-full">
            {create.isPending ? "Creating…" : "Create Collection"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function CollectionsList() {
  const { data: collections = [], isLoading, error } = useCollections();

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-tight">Collections</h1>
        <NewCollectionSheet />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading collections…</p>
      )}
      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load."}
        </p>
      )}
      {!isLoading && !error && collections.length === 0 && (
        <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
          No collections yet. Create one to group your listings.
        </p>
      )}
      {collections.map((c) => (
        <CollectionCard key={c.id} collection={c} />
      ))}
    </div>
  );
}
