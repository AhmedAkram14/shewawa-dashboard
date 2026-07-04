"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useFactories } from "@/features/factories/hooks/use-factories";
import type { FactoryRow } from "@/features/factories/api/factories";

import { usePendingOrderLines } from "../hooks/use-factory-orders";
import { useCreateFactoryOrder } from "../hooks/use-create-factory-order";
import { friendlyError } from "@/lib/db-error";
import type { PendingOrderLine } from "../api/factory-orders";

type VariantGroup = {
  product_variant_id: string;
  variantName: string;
  productName: string;
  lines: PendingOrderLine[];
};

export function NewFactoryOrderView() {
  const router = useRouter();
  const [selectedFactory, setSelectedFactory] = useState<FactoryRow | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [factoryPickerOpen, setFactoryPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: factories = [] } = useFactories();
  const { data: pendingLines = [] } = usePendingOrderLines();
  const createFactoryOrder = useCreateFactoryOrder();

  // Group pending lines by variant, sorted by product name then variant name
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

  // ── Selection helpers ────────────────────────────────────────────────────

  function selectAll() {
    setSelectedIds(new Set(pendingLines.map((l) => l.id)));
  }

  function clearAll() {
    setSelectedIds(new Set());
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

  function toggleLine(lineId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  }

  // ── Review summary ───────────────────────────────────────────────────────

  const selectedLines = pendingLines.filter((l) => selectedIds.has(l.id));
  const totalPieces = selectedLines.reduce((s, l) => s + l.quantity, 0);
  const variantCount = new Set(selectedLines.map((l) => l.product_variant_id))
    .size;
  const allSelected =
    pendingLines.length > 0 && selectedIds.size === pendingLines.length;

  // ── Submit ───────────────────────────────────────────────────────────────

  function handleSubmit() {
    setError(null);
    if (!selectedFactory) {
      setError("Please select a factory");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Select at least one order line");
      return;
    }

    const groupsPayload = groups
      .map((g) => ({
        product_variant_id: g.product_variant_id,
        order_line_ids: g.lines
          .filter((l) => selectedIds.has(l.id))
          .map((l) => l.id),
        unit_cost: g.lines[0]?.product_variants.cost_price || null,
      }))
      .filter((g) => g.order_line_ids.length > 0);

    createFactoryOrder.mutate(
      {
        factory_id: selectedFactory.id,
        notes: notes.trim() || null,
        groups: groupsPayload,
      },
      {
        onError: (err) => setError(friendlyError(err)),
      },
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold leading-tight">
          Send to Factory
        </h1>
      </div>

      {/* Factory selection */}
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Factory
        </p>
        {selectedFactory ? (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <p className="font-medium">{selectedFactory.name}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFactoryPickerOpen(true)}
            >
              Change
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setFactoryPickerOpen(true)}
          >
            Select Factory
          </Button>
        )}
      </section>

      {/* Order line selection */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pending Order Lines
          </p>
          {pendingLines.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={allSelected ? clearAll : selectAll}
              className="text-xs"
            >
              {allSelected ? "Clear All" : "Select All Pending"}
            </Button>
          )}
        </div>

        {pendingLines.length === 0 ? (
          <div className="rounded-lg border py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No pending order lines
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const groupSelectedCount = group.lines.filter((l) =>
                selectedIds.has(l.id),
              ).length;
              const groupAllSelected =
                groupSelectedCount === group.lines.length;
              const groupSelectedQty = group.lines
                .filter((l) => selectedIds.has(l.id))
                .reduce((s, l) => s + l.quantity, 0);

              return (
                <div
                  key={group.product_variant_id}
                  className="rounded-lg border"
                >
                  {/* Variant group header */}
                  <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{group.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.variantName}
                        {groupSelectedCount > 0 && (
                          <> · {groupSelectedQty} pcs selected</>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={
                        groupAllSelected
                          ? () => clearVariant(group)
                          : () => selectVariant(group)
                      }
                      className="text-xs shrink-0"
                    >
                      {groupAllSelected ? "Clear" : "Select All"}
                    </Button>
                  </div>

                  {/* Cost summary — shown when any line in group is selected */}
                  {groupSelectedCount > 0 && (
                    <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
                      <span>
                        {groupSelectedQty} pcs × EGP{" "}
                        {(
                          group.lines[0]?.product_variants.cost_price / 100
                        ).toFixed(2)}
                        /pc
                      </span>
                      <span className="font-medium text-foreground">
                        = EGP{" "}
                        {(
                          ((group.lines[0]?.product_variants.cost_price ?? 0) *
                            groupSelectedQty) /
                          100
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Individual order lines */}
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
                            <span className="text-sm text-muted-foreground shrink-0">
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
      </section>

      {/* Review summary — always visible */}
      <section className="divide-y rounded-lg border">
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">
            Selected Order Lines
          </span>
          <span className="text-sm font-medium">{selectedIds.size}</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">Total Pieces</span>
          <span className="text-sm font-medium">{totalPieces}</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">Variant Count</span>
          <span className="text-sm font-medium">{variantCount}</span>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-1.5">
        <Label htmlFor="fo-notes">
          Notes{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="fo-notes"
          placeholder="Any notes for this factory order"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={createFactoryOrder.isPending}
      >
        {createFactoryOrder.isPending
          ? "Creating Factory Order…"
          : "Create Factory Order"}
      </Button>

      {/* Factory picker sheet */}
      <Sheet open={factoryPickerOpen} onOpenChange={setFactoryPickerOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Select Factory</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/factories" />}
              onClick={() => setFactoryPickerOpen(false)}
            >
              <Plus />
              Manage Factories
            </Button>
            {factories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No factories yet
              </p>
            ) : (
              <ul className="max-h-80 divide-y overflow-y-auto">
                {factories.map((f) => (
                  <li key={f.id}>
                    <button
                      onClick={() => {
                        setSelectedFactory(f);
                        setFactoryPickerOpen(false);
                      }}
                      className="flex w-full flex-col items-start py-3 text-left transition-colors hover:text-foreground"
                    >
                      <span className="font-medium">{f.name}</span>
                      {f.contact && (
                        <span className="text-xs text-muted-foreground">
                          {f.contact}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
