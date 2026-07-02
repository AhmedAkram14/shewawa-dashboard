"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useFactoryOrder } from "../hooks/use-factory-orders";
import type { FactoryOrderDetail } from "../api/factory-orders";
import { FactoryOrderStatusBadge } from "./factory-order-status-badge";

interface Props {
  id: string;
  initialData: FactoryOrderDetail;
}

export function FactoryOrderDetailView({ id, initialData }: Props) {
  const { data: fo } = useFactoryOrder(id, initialData);

  if (!fo) return null;

  const totalPieces = fo.factory_order_lines.reduce(
    (s, l) => s + l.quantity,
    0,
  );

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/factory-orders" />}
        >
          <ArrowLeft />
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold leading-tight">
            #{fo.factory_order_number}
          </h1>
          <FactoryOrderStatusBadge status={fo.status} />
        </div>
      </div>

      {/* Factory */}
      <section className="rounded-lg border p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Factory
        </p>
        <Link
          href={`/factories/${fo.factory_id}`}
          className="mt-1 block font-medium hover:underline"
        >
          {fo.factories.name}
        </Link>
      </section>

      {/* Lines */}
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Items · {fo.factory_order_lines.length} variant
          {fo.factory_order_lines.length !== 1 ? "s" : ""} · {totalPieces} pcs
        </p>
        <ul className="divide-y rounded-lg border">
          {fo.factory_order_lines.map((line) => (
            <li key={line.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">
                  {line.product_variants.products.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {line.product_variants.name}
                </p>
              </div>
              <span className="text-sm font-medium">{line.quantity} pcs</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Notes */}
      {fo.notes && (
        <section>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Notes
          </p>
          <p className="text-sm">{fo.notes}</p>
        </section>
      )}

      <Separator />

      <p className="text-xs text-muted-foreground">
        Created {new Date(fo.created_at).toLocaleString("en-EG")}
      </p>
    </div>
  );
}
