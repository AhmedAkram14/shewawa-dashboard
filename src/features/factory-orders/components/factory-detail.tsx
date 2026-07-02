"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useFactory } from "../hooks/use-factories";
import { FactoryOrderStatusBadge } from "./factory-order-status-badge";
import type { FactoryOrderStatus } from "../schemas";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FactoryDetail({ id }: { id: string }) {
  const { data: factory, isLoading, error } = useFactory(id);

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error || !factory) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : "Factory not found."}
      </div>
    );
  }

  const activeProducts = factory.products.filter((p) => p.is_active);
  const inactiveProducts = factory.products.filter((p) => !p.is_active);

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      <Link
        href="/factories"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Factories
      </Link>

      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold leading-tight">{factory.name}</h1>
        {factory.contact && (
          <p className="text-sm text-muted-foreground">{factory.contact}</p>
        )}
      </div>

      <Separator />

      {/* Products */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">
          Products ({factory.products.length})
        </h2>
        {factory.products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No products assigned to this factory yet.
          </p>
        ) : (
          <div className="rounded-md border divide-y text-sm">
            {activeProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2.5"
              >
                <span className="font-medium truncate">{p.name}</span>
                <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                  Active
                </Badge>
              </div>
            ))}
            {inactiveProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2.5 opacity-50"
              >
                <span className="truncate">{p.name}</span>
                <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                  Inactive
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Factory orders */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">
          Factory Orders ({factory.factory_orders.length})
        </h2>
        {factory.factory_orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No factory orders yet.
          </p>
        ) : (
          <div className="space-y-2">
            {factory.factory_orders.map((fo) => (
              <Link
                key={fo.id}
                href={`/factory-orders/${fo.id}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2.5 hover:bg-accent/50 transition-colors text-sm"
              >
                <div className="min-w-0 space-y-0.5">
                  {fo.reference && (
                    <p className="font-medium truncate">Ref: {fo.reference}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(fo.created_at)}
                  </p>
                </div>
                <FactoryOrderStatusBadge
                  status={fo.status as FactoryOrderStatus}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
