"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

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
          {orders.map((fo) => (
            <li key={fo.id}>
              <Link
                href={`/factory-orders/${fo.id}`}
                className="flex items-center justify-between py-3 transition-colors hover:text-foreground"
              >
                <div>
                  <p className="font-medium">
                    #{fo.factory_order_number} — {fo.factories.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(fo.created_at).toLocaleDateString("en-EG")}
                  </p>
                </div>
                <FactoryOrderStatusBadge status={fo.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
