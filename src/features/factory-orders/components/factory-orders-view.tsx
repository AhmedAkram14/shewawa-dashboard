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
        <ul className="divide-y">
          {orders.map((fo) => {
            const pcs = fo.factory_order_lines.reduce(
              (sum, l) => sum + l.quantity,
              0,
            );
            const allCostsKnown = fo.factory_order_lines.every(
              (l) => l.unit_cost != null,
            );
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
                  className="block py-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold">
                      #{fo.factory_order_number} — {fo.factories.name}
                    </span>
                    <FactoryOrderStatusBadge status={fo.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                    {pcs > 0 && <span>{pcs} pcs</span>}
                    {totalCost != null && (
                      <>
                        {pcs > 0 && <span>·</span>}
                        <span>EGP {formatPrice(totalCost)}</span>
                      </>
                    )}
                    <span className="ml-auto text-xs">{date}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
