"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format";
import { FactoryOrderStatusBadge } from "@/features/factory-orders/components/factory-order-status-badge";
import { useFactoryOrdersByFactory } from "@/features/factory-orders/hooks/use-factory-orders";

import { useFactory } from "../hooks/use-factories";
import type { FactoryRow } from "../api/factories";
import { FactorySheet } from "./factory-sheet";

interface Props {
  id: string;
  initialData: FactoryRow;
}

export function FactoryDetailView({ id, initialData }: Props) {
  const router = useRouter();
  const { data: factory } = useFactory(id, initialData);
  const { data: orders = [], isLoading } = useFactoryOrdersByFactory(id);
  const [editOpen, setEditOpen] = useState(false);

  if (!factory) return null;

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold leading-tight">
            {factory.name}
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
            <Pencil />
          </Button>
        </div>
      </div>

      <section className="divide-y rounded-lg border">
        <div className="p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contact
          </p>
          <p className="mt-1 text-sm">
            {factory.contact ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </p>
        </div>
        <div className="p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Notes
          </p>
          <p className="mt-1 text-sm">
            {factory.notes ?? <span className="text-muted-foreground">—</span>}
          </p>
        </div>
      </section>

      <Separator />

      {/* Factory order history */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Factory Orders
      </h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No orders with this factory yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {orders.map((fo) => {
            const pcs = fo.factory_order_lines.reduce(
              (sum, l) => sum + l.quantity,
              0,
            );
            const allCostsKnown =
              fo.factory_order_lines.length > 0 &&
              fo.factory_order_lines.every((l) => l.unit_cost != null);
            const totalCost = allCostsKnown
              ? fo.factory_order_lines.reduce(
                  (sum, l) => sum + l.quantity * (l.unit_cost ?? 0),
                  0,
                )
              : null;
            const date = new Date(fo.created_at).toLocaleDateString("en-EG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            return (
              <li key={fo.id}>
                <Link
                  href={`/factory-orders/${fo.id}`}
                  className="block rounded-xl border bg-card p-3 transition-all hover:border-primary/20 hover:shadow-sm active:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold leading-snug">
                        #{fo.factory_order_number}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {date}
                      </p>
                    </div>
                    <FactoryOrderStatusBadge status={fo.status} />
                  </div>
                  {pcs > 0 && (
                    <div className="mt-2 flex items-center gap-3 border-t pt-2 text-sm text-muted-foreground">
                      <span>{pcs} pcs</span>
                      {totalCost != null ? (
                        <span>EGP {formatPrice(totalCost)}</span>
                      ) : (
                        <span className="text-xs italic">cost not set</span>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Added {new Date(factory.created_at).toLocaleDateString("en-EG")}
      </p>

      <FactorySheet
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        factory={factory}
      />
    </div>
  );
}
