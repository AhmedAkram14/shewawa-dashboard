"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { OrderDetail } from "../api/orders";
import { useCancelOrder } from "../hooks/use-cancel-order";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
}

export function CancelOrderSheet({ open, onOpenChange, order }: Props) {
  const mutation = useCancelOrder(order.id);
  const error = mutation.error?.message ?? null;

  // Clear stale error state whenever the sheet opens
  useEffect(() => {
    if (open) mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const nonCancelled = order.order_lines.filter(
    (l) => l.status !== "cancelled",
  );
  const pendingLines = nonCancelled.filter((l) => l.status === "pending");
  const atFactoryLines = nonCancelled.filter((l) => l.status === "at_factory");
  const allocatedLines = nonCancelled.filter((l) => l.status === "allocated");
  const returningPcs = nonCancelled.reduce(
    (s, l) => s + l.allocated_quantity,
    0,
  );

  function handleCancel() {
    mutation.mutate(undefined);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Cancel Order #{order.order_number}?</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. Review the impact below before
            confirming.
          </p>

          {/* Impact summary (Refinement 3) */}
          <div className="divide-y rounded-lg border">
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">
                Pending Lines
              </span>
              <span className="text-sm font-medium">{pendingLines.length}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">
                At Factory Lines
              </span>
              <span className="text-sm font-medium">
                {atFactoryLines.length}
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">
                Allocated Lines
              </span>
              <span className="text-sm font-medium">
                {allocatedLines.length}
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">
                Pieces Returning to Stock
              </span>
              <span
                className={`text-sm font-medium ${returningPcs > 0 ? "text-warn-tx" : ""}`}
              >
                {returningPcs} pcs
              </span>
            </div>
          </div>

          {atFactoryLines.length > 0 && (
            <p className="text-xs text-muted-foreground">
              At-factory lines will remain in the factory order. Any goods
              received for them after cancellation will go to available stock
              automatically.
            </p>
          )}

          <Separator />

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Cancelling…" : "Cancel Order"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
