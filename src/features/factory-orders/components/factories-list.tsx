"use client";

import Link from "next/link";

import { useFactories } from "../hooks/use-factories";
import { CreateFactorySheet } from "./create-factory-sheet";
import type { FactoryRow } from "@/lib/supabase/database.types";

function FactoryCard({ factory }: { factory: FactoryRow }) {
  return (
    <Link
      href={`/factories/${factory.id}`}
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium truncate">{factory.name}</p>
        {factory.contact && (
          <p className="text-xs text-muted-foreground truncate">
            {factory.contact}
          </p>
        )}
      </div>
      <span className="ml-3 text-muted-foreground shrink-0">→</span>
    </Link>
  );
}

export function FactoriesList() {
  const { data: factories = [], isLoading, error } = useFactories();

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Factories</h1>
        <CreateFactorySheet />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading factories…</p>
      )}
      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load."}
        </p>
      )}
      {!isLoading && !error && factories.length === 0 && (
        <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
          No factories yet. Add one to start assigning products.
        </p>
      )}
      {factories.map((f) => (
        <FactoryCard key={f.id} factory={f} />
      ))}
    </div>
  );
}
