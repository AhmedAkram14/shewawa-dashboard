"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useFactoryOrder } from "../hooks/use-factory-orders";
import type {
  FactoryOrderDetail,
  FactoryOrderLineDetail,
} from "../api/factory-orders";
import { FactoryOrderStatusBadge } from "./factory-order-status-badge";
import { RecordReceiptSheet } from "./record-receipt-sheet";
import { AppendFactoryOrderSheet } from "./append-factory-order-sheet";

interface Props {
  id: string;
  initialData: FactoryOrderDetail;
}

function totalReceivedForLine(fol: FactoryOrderLineDetail): number {
  return fol.factory_receipts
    .filter((r) => r.reversal_of === null)
    .reduce((s, r) => s + r.quantity, 0);
}

export function FactoryOrderDetailView({ id, initialData }: Props) {
  const { data: fo } = useFactoryOrder(id, initialData);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [appendOpen, setAppendOpen] = useState(false);

  if (!fo) return null;

  const totalPieces = fo.factory_order_lines.reduce(
    (s, l) => s + l.quantity,
    0,
  );

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
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

      {/* Lines with per-line progress (Refinement 2) */}
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Items · {fo.factory_order_lines.length} variant
          {fo.factory_order_lines.length !== 1 ? "s" : ""} · {totalPieces} pcs
        </p>
        <ul className="divide-y rounded-lg border">
          {fo.factory_order_lines.map((line) => {
            const received = totalReceivedForLine(line);
            const remaining = line.quantity - received;
            const isComplete = remaining === 0;
            const activeReceipts = line.factory_receipts.filter(
              (r) => r.reversal_of === null,
            );

            return (
              <li key={line.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {line.product_variants.products.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {line.product_variants.name}
                    </p>
                  </div>
                  {isComplete ? (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Complete
                    </span>
                  ) : (
                    <span className="shrink-0 text-sm font-medium">
                      {line.quantity} pcs
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex gap-4 text-xs text-muted-foreground">
                  <span>Ordered: {line.quantity}</span>
                  <span>Received: {received}</span>
                  {!isComplete && <span>Remaining: {remaining}</span>}
                </div>

                {activeReceipts.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {activeReceipts.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                        <span>
                          {new Date(r.received_at).toLocaleDateString("en-EG")}
                        </span>
                        <span className="font-medium text-foreground">
                          +{r.quantity} pcs
                        </span>
                        {r.notes && <span className="truncate">{r.notes}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

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

      {fo.status === "open" && (
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setAppendOpen(true)}
          >
            Add Orders
          </Button>
          <Button className="w-full" onClick={() => setReceiptOpen(true)}>
            Record Factory Receipt
          </Button>
        </div>
      )}

      <RecordReceiptSheet
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        fo={fo}
      />

      <AppendFactoryOrderSheet
        open={appendOpen}
        onOpenChange={setAppendOpen}
        factoryOrderId={fo.id}
        factoryOrderNumber={fo.factory_order_number}
      />
    </div>
  );
}
