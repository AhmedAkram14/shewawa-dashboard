"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { usePendingOrderLines } from "../hooks/use-factory-orders";
import { useAppendFactoryOrder } from "../hooks/use-append-factory-order";
import { friendlyError } from "@/lib/db-error";
import type { PendingOrderLine } from "../api/factory-orders";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryOrderId: string;
  factoryOrderNumber: number;
}

type VariantGroup = {
  product_variant_id: string;
  variantName: string;
  productName: string;
  lines: PendingOrderLine[];
};

export function AppendFactoryOrderSheet({
  open,
  onOpenChange,
  factoryOrderId,
  factoryOrderNumber,
}: Props) {
  const mutation = useAppendFactoryOrder(factoryOrderId);
  const { data: pendingLines = [] } = usePendingOrderLines();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo<VariantGroup[]>(() => {
    const map = new Map<string, VariantGroup>();
    for (const line of pendingLines) {
      const key = line.product_variant_id;
      if (!map.has(key)) {
        map.set(key, {
          product_variant_id: key,
          variantName: line.product_variants.name,
          productName: line.product_variants.products.name,
          lines: [],
        });
      }
      map.get(key)!.lines.push(line);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        a.productName.localeCompare(b.productName) ||
        a.variantName.localeCompare(b.variantName),
    );
  }, [pendingLines]);

  function toggleLine(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVariant(group: VariantGroup) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      group.lines.forEach((l) => next.add(l.id));
      return next;
    });
  }

  function clearVariant(group: VariantGroup) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      group.lines.forEach((l) => next.delete(l.id));
      return next;
    });
  }

  function handleOpen(isOpen: boolean) {
    if (!isOpen) {
      setSelectedIds(new Set());
      setError(null);
      mutation.reset();
    }
    onOpenChange(isOpen);
  }

  function handleSubmit() {
    setError(null);
    if (selectedIds.size === 0) {
      setError("Select at least one order line");
      return;
    }
    mutation.mutate(Array.from(selectedIds), {
      onSuccess: () => handleOpen(false),
      onError: (err) => setError(friendlyError(err)),
    });
  }

  const selectedLines = pendingLines.filter((l) => selectedIds.has(l.id));
  const totalPieces = selectedLines.reduce((s, l) => s + l.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            Add Orders to Factory Order #{factoryOrderNumber}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          {pendingLines.length === 0 ? (
            <div className="rounded-lg border py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No pending order lines to add
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const groupSelected = group.lines.filter((l) =>
                  selectedIds.has(l.id),
                );
                const allSelected = groupSelected.length === group.lines.length;
                const selectedQty = groupSelected.reduce(
                  (s, l) => s + l.quantity,
                  0,
                );

                return (
                  <div
                    key={group.product_variant_id}
                    className="rounded-lg border"
                  >
                    <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">
                          {group.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {group.variantName}
                          {groupSelected.length > 0 && (
                            <> · {selectedQty} pcs selected</>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={
                          allSelected
                            ? () => clearVariant(group)
                            : () => selectVariant(group)
                        }
                        className="shrink-0 text-xs"
                      >
                        {allSelected ? "Clear" : "Select All"}
                      </Button>
                    </div>
                    <ul className="divide-y">
                      {group.lines.map((line) => {
                        const checked = selectedIds.has(line.id);
                        return (
                          <li key={line.id}>
                            <button
                              onClick={() => toggleLine(line.id)}
                              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                checked ? "bg-primary/5" : "hover:bg-muted/30"
                              }`}
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  checked
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input"
                                }`}
                              >
                                {checked && (
                                  <svg
                                    viewBox="0 0 10 8"
                                    className="h-2.5 w-2.5 fill-current"
                                  >
                                    <path
                                      d="M1 4l3 3 5-6"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                  Order #{line.orders.order_number} —{" "}
                                  {line.orders.customers.name}
                                </p>
                              </div>
                              <span className="shrink-0 text-sm text-muted-foreground">
                                {line.quantity} pcs
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary */}
          {pendingLines.length > 0 && (
            <div className="divide-y rounded-lg border">
              <div className="flex justify-between p-3">
                <span className="text-sm text-muted-foreground">
                  Selected Lines
                </span>
                <span className="text-sm font-medium">{selectedIds.size}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-sm text-muted-foreground">
                  Total Pieces
                </span>
                <span className="text-sm font-medium">{totalPieces} pcs</span>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={mutation.isPending || pendingLines.length === 0}
          >
            {mutation.isPending ? "Adding…" : "Add to Factory Order"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
