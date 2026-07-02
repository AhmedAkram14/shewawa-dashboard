"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useFactories } from "../hooks/use-factories";
import type { FactoryRow } from "../api/factories";
import { FactorySheet } from "./factory-sheet";

interface Props {
  initialData: FactoryRow[];
}

export function FactoriesView({ initialData }: Props) {
  const { data: factories = [] } = useFactories(initialData);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-tight">Factories</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus />
          New
        </Button>
      </div>

      {factories.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-4 text-sm text-muted-foreground">No factories yet</p>
          <Button onClick={() => setAddOpen(true)}>
            Add your first factory
          </Button>
        </div>
      ) : (
        <ul className="divide-y">
          {factories.map((f) => (
            <li key={f.id}>
              <Link
                href={`/factories/${f.id}`}
                className="flex items-center justify-between py-3 transition-colors hover:text-foreground"
              >
                <div>
                  <p className="font-medium">{f.name}</p>
                  {f.contact && (
                    <p className="text-xs text-muted-foreground">{f.contact}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <FactorySheet mode="add" open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
