"use client";

import { ArrowLeft, Banknote, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { Truck } from "lucide-react";
import { RecommendationList } from "@/features/workflow/recommendation-list";
import type { Recommendation } from "@/features/workflow/derive-recommendations";
import { formatPrice } from "@/lib/format";
import { useFactoryOrder } from "../hooks/use-factory-orders";
import type {
  FactoryOrderDetail,
  FactoryOrderLineDetail,
} from "../api/factory-orders";
import { FactoryOrderStatusBadge } from "./factory-order-status-badge";
import { RecordReceiptSheet } from "./record-receipt-sheet";
import { AppendFactoryOrderSheet } from "./append-factory-order-sheet";
import { RecordPaymentSheet } from "./record-payment-sheet";
import { useSetFactoryLineCost } from "../hooks/use-set-factory-line-cost";

function getFactoryOrderRecommendations(
  fo: FactoryOrderDetail,
): Recommendation[] {
  const readyOrderIds = new Set<string>();
  for (const fol of fo.factory_order_lines) {
    for (const ol of fol.order_lines) {
      if (ol.orders.status === "ready") {
        readyOrderIds.add(ol.order_id);
      }
    }
  }

  if (readyOrderIds.size === 0) return [];

  const n = readyOrderIds.size;
  return [
    {
      id: "create-delivery",
      priority: 1,
      icon: Truck,
      iconClass: "text-primary",
      message: `${n} order${n !== 1 ? "s" : ""} from this batch ${n !== 1 ? "are" : "is"} ready for delivery`,
      actionLabel: "Create Delivery",
      href: "/deliveries",
    },
  ];
}

function totalReceivedForLine(fol: FactoryOrderLineDetail): number {
  return fol.factory_receipts
    .filter((r) => r.reversal_of === null)
    .reduce((s, r) => s + r.quantity, 0);
}

function InlineCostEditor({
  line,
  factoryOrderId,
}: {
  line: FactoryOrderLineDetail;
  factoryOrderId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    line.unit_cost != null ? (line.unit_cost / 100).toFixed(2) : "",
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const setLineCost = useSetFactoryLineCost(factoryOrderId);

  function startEditing() {
    setEditing(true);
    setValue(line.unit_cost != null ? (line.unit_cost / 100).toFixed(2) : "");
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    const parsed = parseFloat(value);
    const piastres =
      isNaN(parsed) || parsed <= 0 ? null : Math.round(parsed * 100);
    setLineCost.mutate(
      { line_id: line.id, unit_cost: piastres },
      { onSuccess: () => setEditing(false), onError: () => setEditing(false) },
    );
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">EGP</span>
        <Input
          ref={inputRef}
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          onBlur={commit}
          className="h-7 w-24 text-xs"
          autoFocus
        />
        <span className="text-xs text-muted-foreground">/pc</span>
      </div>
    );
  }

  if (line.unit_cost != null) {
    return (
      <button
        onClick={startEditing}
        className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        EGP {formatPrice(line.unit_cost)}/pc · total EGP{" "}
        {formatPrice(line.unit_cost * line.quantity)}
        <Pencil className="h-3 w-3 opacity-50" />
      </button>
    );
  }

  return (
    <button
      onClick={startEditing}
      className="mt-1.5 flex items-center gap-1 text-xs text-warn-tx hover:text-foreground"
    >
      <Pencil className="h-3 w-3" />
      Set cost price
    </button>
  );
}

interface Props {
  id: string;
  initialData: FactoryOrderDetail;
}

export function FactoryOrderDetailView({ id, initialData }: Props) {
  const router = useRouter();
  const { data: fo } = useFactoryOrder(id, initialData);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [appendOpen, setAppendOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  if (!fo) return null;

  const totalPieces = fo.factory_order_lines.reduce(
    (s, l) => s + l.quantity,
    0,
  );

  const agreedCost = fo.factory_order_lines.reduce(
    (s, l) => (l.unit_cost != null ? s + l.quantity * l.unit_cost : s),
    0,
  );
  const costLinesUnknown = fo.factory_order_lines.filter(
    (l) => l.unit_cost == null,
  ).length;
  const totalPaid = fo.factory_payments.reduce((s, p) => s + p.amount, 0);
  const totalOwed = Math.max(agreedCost - totalPaid, 0);

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
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
                    <span className="shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success-tx">
                      Complete
                    </span>
                  ) : (
                    <span className="shrink-0 text-sm font-medium">
                      {line.quantity} pcs
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Ordered: {line.quantity}</span>
                  <span>Received: {received}</span>
                  {!isComplete && <span>Remaining: {remaining}</span>}
                </div>

                <InlineCostEditor line={line} factoryOrderId={fo.id} />

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

      {/* Financial summary for this order */}
      <section className="rounded-lg border bg-card divide-y">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">Agreed cost</span>
          <div className="text-right">
            <span className="text-sm font-semibold">
              {agreedCost > 0 ? `EGP ${formatPrice(agreedCost)}` : "—"}
            </span>
            {costLinesUnknown > 0 && (
              <p className="text-xs text-muted-foreground">
                {costLinesUnknown} line
                {costLinesUnknown !== 1 ? "s" : ""} missing cost
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">Paid</span>
          <span className="text-sm font-semibold text-success-tx">
            {totalPaid > 0 ? `EGP ${formatPrice(totalPaid)}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium">Still owed</span>
          <span
            className={`text-sm font-bold ${totalOwed > 0 ? "text-coral" : "text-success-tx"}`}
          >
            {agreedCost === 0
              ? "—"
              : totalOwed > 0
                ? `EGP ${formatPrice(totalOwed)}`
                : "Fully paid"}
          </span>
        </div>
      </section>

      {/* Payment history */}
      {fo.factory_payments.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Payments
          </p>
          <ul className="divide-y rounded-lg border">
            {fo.factory_payments
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
              )
              .map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      EGP {formatPrice(p.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.paid_at).toLocaleDateString("en-EG")}
                      {p.reference && ` · ${p.reference}`}
                    </p>
                    {p.notes && (
                      <p className="text-xs text-muted-foreground">{p.notes}</p>
                    )}
                  </div>
                  <Banknote className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                </li>
              ))}
          </ul>
        </section>
      )}

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

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setPaymentOpen(true)}
        >
          <Banknote className="mr-1 h-4 w-4" />
          Record Payment
        </Button>
        {fo.status === "open" && (
          <>
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
          </>
        )}
      </div>

      {(() => {
        const recs = getFactoryOrderRecommendations(fo);
        return recs.length > 0 ? (
          <RecommendationList recommendations={recs} label="What's Next" />
        ) : null;
      })()}

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

      <RecordPaymentSheet
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        factoryOrderId={fo.id}
        factoryName={fo.factories.name}
      />
    </div>
  );
}
