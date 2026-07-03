"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";

import type { StockEntry } from "../api/available-stock";
import {
  getPendingLinesForVariant,
  type PendingOrderLineForVariant,
} from "../api/available-stock";
import { useAllocateFromStock } from "../hooks/use-allocate-from-stock";

interface Props {
  stock: StockEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function AllocateStockSheet({ stock, onOpenChange }: Props) {
  const open = stock !== null;
  const mutation = useAllocateFromStock();

  const [lines, setLines] = useState<PendingOrderLineForVariant[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("");
  const [qty, setQty] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !stock) {
      setLines([]);
      setSelectedLine("");
      setQty("");
      setError(null);
      mutation.reset();
      return;
    }

    getPendingLinesForVariant(createClient(), stock.product_variant_id).then(
      setLines,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stock?.product_variant_id]);

  // Auto-set qty when a line is selected
  useEffect(() => {
    if (!selectedLine || !stock) return;
    const line = lines.find((l) => l.id === selectedLine);
    if (!line) return;
    const remaining = line.quantity - line.allocated_quantity;
    setQty(String(Math.min(remaining, stock.quantity)));
  }, [selectedLine, lines, stock]);

  function handleAllocate() {
    if (!stock) return;
    setError(null);
    const q = parseInt(qty, 10);
    if (!selectedLine) {
      setError("Select an order line");
      return;
    }
    if (isNaN(q) || q <= 0) {
      setError("Enter a valid quantity");
      return;
    }
    mutation.mutate(
      { stock_id: stock.id, order_line_id: selectedLine, quantity: q },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setError(err.message),
      },
    );
  }

  const selectedLineData = lines.find((l) => l.id === selectedLine);
  const maxQty = selectedLineData
    ? Math.min(
        selectedLineData.quantity - selectedLineData.allocated_quantity,
        stock?.quantity ?? 0,
      )
    : (stock?.quantity ?? 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Allocate Stock</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          {/* Stock summary */}
          {stock && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">
                {stock.product_variants.products.name} —{" "}
                {stock.product_variants.name}
              </p>
              <p className="text-muted-foreground">
                {stock.quantity} pcs available · {formatSource(stock.source)}
              </p>
            </div>
          )}

          {/* Order line picker */}
          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No pending order lines need this variant.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label>Order Line</Label>
              <ul className="divide-y rounded-lg border">
                {lines.map((line) => {
                  const remaining = line.quantity - line.allocated_quantity;
                  const isSelected = selectedLine === line.id;
                  return (
                    <li
                      key={line.id}
                      className={`cursor-pointer p-3 transition-colors ${
                        isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                      }`}
                      onClick={() => setSelectedLine(line.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {line.orders.customers.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Order #{line.orders.order_number}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          needs {remaining} pcs
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Quantity */}
          {selectedLine && (
            <div className="space-y-1.5">
              <Label htmlFor="alloc-qty">
                Quantity{" "}
                <span className="font-normal text-muted-foreground">
                  (max {maxQty})
                </span>
              </Label>
              <Input
                id="alloc-qty"
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-32"
              />
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleAllocate}
            disabled={mutation.isPending || !selectedLine || lines.length === 0}
          >
            {mutation.isPending ? "Allocating…" : "Allocate"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatSource(source: string) {
  if (source === "factory_surplus") return "Factory surplus";
  if (source === "cancellation") return "From cancellation";
  return "Manual entry";
}
