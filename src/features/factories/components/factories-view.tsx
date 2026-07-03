"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useFactories } from "../hooks/use-factories";
import type { FactoryWithStats } from "../api/factories";
import { FactorySheet } from "./factory-sheet";

interface Props {
  initialData: FactoryWithStats[];
}

export function FactoriesView({ initialData }: Props) {
  const router = useRouter();
  const { data: factories = [] } = useFactories(initialData);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="flex-1 text-2xl font-semibold leading-tight">
          Factories
        </h1>
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
        <ul className="space-y-2">
          {factories.map((f) => {
            const openOrders = f.factory_orders.filter(
              (fo) => fo.status !== "closed",
            ).length;
            return (
              <li key={f.id}>
                <Link
                  href={`/factories/${f.id}`}
                  className="block rounded-xl border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm active:bg-accent"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{f.name}</span>
                    {openOrders > 0 && (
                      <span className="shrink-0 rounded-full bg-warn-bg px-2.5 py-0.5 text-xs font-semibold text-warn-tx">
                        {openOrders} open
                      </span>
                    )}
                  </div>
                  {f.contact && (
                    <div className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                      {f.contact}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <FactorySheet mode="add" open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
