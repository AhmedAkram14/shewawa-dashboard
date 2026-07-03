"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type {
  AllocationOrderLine,
  FactoryOrderDetail,
  FactoryOrderLineDetail,
} from "../api/factory-orders";
import { useRecordFactoryReceipts } from "../hooks/use-record-factory-receipts";

// ── Types ────────────────────────────────────────────────────────────────────

type AllocationMap = Record<string, Record<string, number>>; // folId → olId → qty

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fo: FactoryOrderDetail;
}

// ── FIFO allocation computation ──────────────────────────────────────────────

function computeFIFO(
  orderLines: AllocationOrderLine[],
  receiptQty: number,
): Record<string, number> {
  const allocatable = orderLines
    .filter((l) => l.status === "at_factory")
    .sort(
      (a, b) =>
        a.orders.created_at.localeCompare(b.orders.created_at) ||
        a.id.localeCompare(b.id),
    );

  let remaining = receiptQty;
  const result: Record<string, number> = {};

  for (const line of allocatable) {
    const unmet = line.quantity - line.allocated_quantity;
    const give = Math.min(unmet, remaining);
    result[line.id] = give;
    remaining -= give;
    if (remaining === 0) break;
  }

  for (const line of allocatable) {
    if (!(line.id in result)) result[line.id] = 0;
  }

  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function totalReceivedForLine(fol: FactoryOrderLineDetail): number {
  return fol.factory_receipts
    .filter((r) => r.reversal_of === null)
    .reduce((s, r) => s + r.quantity, 0);
}

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RecordReceiptSheet({ open, onOpenChange, fo }: Props) {
  const [stage, setStage] = useState<"quantities" | "allocations">(
    "quantities",
  );
  const [receivedAt, setReceivedAt] = useState(todayDateString);
  const [notes, setNotes] = useState("");
  // quantities[folId] = string input value (stage 1)
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  // allocations[folId][olId] = qty (stage 2)
  const [allocations, setAllocations] = useState<AllocationMap>({});
  const [fifoAllocations, setFifoAllocations] = useState<AllocationMap>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useRecordFactoryReceipts(fo.id);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStage("quantities");
      setReceivedAt(todayDateString());
      setNotes("");
      setQuantities({});
      setAllocations({});
      setFifoAllocations({});
      setSubmitError(null);
    }
  }, [open]);

  // FOLs with remaining capacity
  const folsWithRemaining = useMemo(
    () =>
      fo.factory_order_lines.map((fol) => {
        const received = totalReceivedForLine(fol);
        const remaining = fol.quantity - received;
        return { fol, received, remaining };
      }),
    [fo.factory_order_lines],
  );

  // Active entries: FOLs where qty > 0 was entered
  const activeEntries = useMemo(() => {
    return folsWithRemaining
      .map(({ fol }) => ({
        fol,
        qty: parseInt(quantities[fol.id] || "0") || 0,
      }))
      .filter(({ qty }) => qty > 0);
  }, [folsWithRemaining, quantities]);

  // ── Stage 2: live summary (Refinement 4) ────────────────────────────────
  const summary = useMemo(() => {
    let receiving = 0;
    let allocated = 0;
    for (const { fol, qty } of activeEntries) {
      receiving += qty;
      const folAllocs = allocations[fol.id] ?? {};
      allocated += Object.values(folAllocs).reduce((s, v) => s + v, 0);
    }
    return { receiving, allocated, surplus: receiving - allocated };
  }, [activeEntries, allocations]);

  // ── Stage 2: manual override detection (Refinement 1) ───────────────────
  const isManualOverride = useMemo(() => {
    for (const [folId, folAllocs] of Object.entries(allocations)) {
      const folFifo = fifoAllocations[folId] ?? {};
      for (const [olId, qty] of Object.entries(folAllocs)) {
        if (qty !== (folFifo[olId] ?? 0)) return true;
      }
    }
    return false;
  }, [allocations, fifoAllocations]);

  // ── Navigation ────────────────────────────────────────────────────────────

  function advanceToAllocations() {
    const newFifo: AllocationMap = {};
    const newAllocs: AllocationMap = {};

    for (const { fol, qty } of activeEntries) {
      const folFifo = computeFIFO(fol.order_lines, qty);
      newFifo[fol.id] = folFifo;
      newAllocs[fol.id] = { ...folFifo };
    }

    setFifoAllocations(newFifo);
    setAllocations(newAllocs);
    setStage("allocations");
  }

  function resetToFIFO() {
    const reset: AllocationMap = {};
    for (const [folId, fifo] of Object.entries(fifoAllocations)) {
      reset[folId] = { ...fifo };
    }
    setAllocations(reset);
  }

  // ── Allocation input handler ──────────────────────────────────────────────

  function setAllocation(folId: string, olId: string, value: string) {
    const qty = parseInt(value) || 0;
    setAllocations((prev) => ({
      ...prev,
      [folId]: { ...(prev[folId] ?? {}), [olId]: Math.max(0, qty) },
    }));
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit() {
    setSubmitError(null);

    const receipts = activeEntries.map(({ fol, qty }) => ({
      factory_order_line_id: fol.id,
      quantity: qty,
      allocations: Object.entries(allocations[fol.id] ?? {}).map(
        ([order_line_id, quantity]) => ({ order_line_id, quantity }),
      ),
    }));

    mutation.mutate(
      {
        received_at: new Date(receivedAt + "T12:00:00").toISOString(),
        notes: notes.trim() || null,
        receipts,
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setSubmitError(err.message),
      },
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Record Factory Receipt</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          {stage === "quantities" ? (
            <StageQuantities
              folsWithRemaining={folsWithRemaining}
              quantities={quantities}
              setQuantities={setQuantities}
              receivedAt={receivedAt}
              setReceivedAt={setReceivedAt}
              notes={notes}
              setNotes={setNotes}
              activeCount={activeEntries.length}
              onNext={advanceToAllocations}
            />
          ) : (
            <StageAllocations
              activeEntries={activeEntries}
              allocations={allocations}
              summary={summary}
              isManualOverride={isManualOverride}
              isPending={mutation.isPending}
              submitError={submitError}
              onSetAllocation={setAllocation}
              onResetToFIFO={resetToFIFO}
              onBack={() => setStage("quantities")}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Stage 1: Quantities ───────────────────────────────────────────────────────

function StageQuantities({
  folsWithRemaining,
  quantities,
  setQuantities,
  receivedAt,
  setReceivedAt,
  notes,
  setNotes,
  activeCount,
  onNext,
}: {
  folsWithRemaining: {
    fol: FactoryOrderLineDetail;
    received: number;
    remaining: number;
  }[];
  quantities: Record<string, string>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  receivedAt: string;
  setReceivedAt: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  activeCount: number;
  onNext: () => void;
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Step 1 of 2 — Enter Quantities
      </p>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="received-at">Received Date</Label>
        <Input
          id="received-at"
          type="date"
          value={receivedAt}
          onChange={(e) => setReceivedAt(e.target.value)}
        />
      </div>

      <Separator />

      {/* Per factory_order_line */}
      <div className="space-y-3">
        {folsWithRemaining.map(({ fol, received, remaining }) => {
          const isComplete = remaining === 0;
          return (
            <div key={fol.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">
                    {fol.product_variants.products.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fol.product_variants.name}
                  </p>
                </div>
                {isComplete && (
                  <span className="shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success-tx">
                    Complete
                  </span>
                )}
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Ordered: {fol.quantity}</span>
                <span>Received: {received}</span>
                <span>Remaining: {remaining}</span>
              </div>

              <div className="flex items-center gap-2">
                <Label
                  htmlFor={`qty-${fol.id}`}
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  Receiving now
                </Label>
                <Input
                  id={`qty-${fol.id}`}
                  type="number"
                  min={0}
                  max={remaining}
                  disabled={isComplete}
                  placeholder="0"
                  value={quantities[fol.id] ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = parseInt(raw) || 0;
                    const clamped = Math.min(Math.max(0, parsed), remaining);
                    setQuantities((prev) => ({
                      ...prev,
                      [fol.id]: raw === "" ? "" : String(clamped),
                    }));
                  }}
                  className="w-24 text-right"
                />
                <span className="text-xs text-muted-foreground">pcs</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="receipt-notes">
          Notes{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="receipt-notes"
          placeholder="Any notes for this receipt"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button className="w-full" onClick={onNext} disabled={activeCount === 0}>
        Review Allocations →
      </Button>
    </>
  );
}

// ── Stage 2: Allocations ──────────────────────────────────────────────────────

function StageAllocations({
  activeEntries,
  allocations,
  summary,
  isManualOverride,
  isPending,
  submitError,
  onSetAllocation,
  onResetToFIFO,
  onBack,
  onSubmit,
}: {
  activeEntries: { fol: FactoryOrderLineDetail; qty: number }[];
  allocations: AllocationMap;
  summary: { receiving: number; allocated: number; surplus: number };
  isManualOverride: boolean;
  isPending: boolean;
  submitError: string | null;
  onSetAllocation: (folId: string, olId: string, value: string) => void;
  onResetToFIFO: () => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Step 2 of 2 — Review Allocation
      </p>

      {/* Refinement 1: Manual override indicator */}
      {isManualOverride && (
        <div className="flex items-center gap-2 rounded-md border border-warn-tx/30 bg-warn-bg px-3 py-2 text-sm text-warn-tx">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1 font-medium">Manual Allocation Override</span>
          <button
            onClick={onResetToFIFO}
            className="text-xs underline hover:no-underline"
          >
            Reset to FIFO
          </button>
        </div>
      )}

      {/* Refinement 4: Live receipt summary */}
      <div className="divide-y rounded-lg border">
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">Receiving</span>
          <span className="text-sm font-medium">{summary.receiving} pcs</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">Allocated</span>
          <span className="text-sm font-medium">{summary.allocated} pcs</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">Surplus</span>
          <span
            className={`text-sm font-medium ${summary.surplus > 0 ? "text-warn-tx" : ""}`}
          >
            {summary.surplus} pcs
          </span>
        </div>
      </div>

      <Separator />

      {/* Per active factory_order_line */}
      <div className="space-y-4">
        {activeEntries.map(({ fol, qty }) => {
          const atFactoryLines = fol.order_lines
            .filter((l) => l.status === "at_factory")
            .sort(
              (a, b) =>
                a.orders.created_at.localeCompare(b.orders.created_at) ||
                a.id.localeCompare(b.id),
            );

          return (
            <div key={fol.id} className="rounded-lg border">
              <div className="border-b bg-muted/40 px-3 py-2">
                <p className="text-sm font-medium">
                  {fol.product_variants.products.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fol.product_variants.name} · Receiving {qty} pcs
                </p>
              </div>

              {atFactoryLines.length === 0 ? (
                <p className="px-3 py-3 text-xs text-muted-foreground">
                  No at-factory order lines — full quantity goes to surplus
                </p>
              ) : (
                <ul className="divide-y">
                  {atFactoryLines.map((ol) => {
                    const unmet = ol.quantity - ol.allocated_quantity;
                    const current = allocations[fol.id]?.[ol.id] ?? 0;
                    return (
                      <li
                        key={ol.id}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            Order #{ol.orders.order_number} —{" "}
                            {ol.orders.customers.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Needs {unmet} pcs
                          </p>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={unmet}
                          value={current}
                          onChange={(e) =>
                            onSetAllocation(fol.id, ol.id, e.target.value)
                          }
                          className="w-20 text-right"
                        />
                        <span className="shrink-0 text-xs text-muted-foreground">
                          pcs
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onBack}
          disabled={isPending}
        >
          ← Back
        </Button>
        <Button className="flex-1" onClick={onSubmit} disabled={isPending}>
          {isPending ? "Recording…" : "Record Receipt"}
        </Button>
      </div>
    </>
  );
}
