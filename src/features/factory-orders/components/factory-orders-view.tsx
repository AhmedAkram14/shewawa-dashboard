"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

import { useFactoryOrders } from "../hooks/use-factory-orders";
import type { FactoryOrderWithFactory } from "../api/factory-orders";
import { FactoryOrderStatusBadge } from "./factory-order-status-badge";

interface Props {
  initialData: FactoryOrderWithFactory[];
}

export function FactoryOrdersView({ initialData }: Props) {
  const router = useRouter();
  const { data: orders = [] } = useFactoryOrders(initialData);

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="flex-1 text-2xl font-semibold leading-tight">
          Factory Orders
        </h1>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/factory-orders/new" />}
        >
          <Plus />
          New
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            No factory orders yet
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/factory-orders/new" />}
          >
            Send to factory
          </Button>
        </div>
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
            });
            return (
              <li key={fo.id}>
                <Link
                  href={`/factory-orders/${fo.id}`}
                  className="block rounded-xl border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm active:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold leading-snug">
                        #{fo.factory_order_number} — {fo.factories.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {date}
                      </p>
                    </div>
                    <FactoryOrderStatusBadge status={fo.status} />
                  </div>
                  {pcs > 0 && (
                    <div className="mt-3 flex items-center gap-3 border-t pt-3 text-sm text-muted-foreground">
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
    </div>
  );
}
