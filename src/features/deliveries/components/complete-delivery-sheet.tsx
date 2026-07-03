"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { DeliveryOrderSummary } from "../api/deliveries";
import { useCompleteDelivery } from "../hooks/use-complete-delivery";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryId: string;
  orders: DeliveryOrderSummary[];
}

export function CompleteDeliverySheet({
  open,
  onOpenChange,
  deliveryId,
  orders,
}: Props) {
  const mutation = useCompleteDelivery(deliveryId);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function toggle(orderId: string) {
    setFailedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  function handleOpen(isOpen: boolean) {
    if (!isOpen) {
      setFailedIds(new Set());
      setError(null);
      mutation.reset();
    }
    onOpenChange(isOpen);
  }

  function handleConfirm() {
    setError(null);
    mutation.mutate(
      { failedOrderIds: Array.from(failedIds) },
      {
        onSuccess: () => handleOpen(false),
        onError: (err) => setError(err.message),
      },
    );
  }

  const deliveredCount = orders.length - failedIds.size;
  const failedCount = failedIds.size;

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Complete Delivery</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          <p className="text-sm text-muted-foreground">
            Mark each order as delivered or returned. Returned orders go back to
            the ready queue with allocations intact.
          </p>

          <ul className="divide-y rounded-lg border">
            {orders.map((order) => {
              const pcs = order.order_lines.reduce((s, l) => s + l.quantity, 0);
              const isFailed = failedIds.has(order.id);
              return (
                <li
                  key={order.id}
                  className={`flex cursor-pointer items-center justify-between p-3 transition-colors ${
                    isFailed ? "bg-destructive/5" : "bg-green-50/60"
                  }`}
                  onClick={() => toggle(order.id)}
                >
                  <div>
                    <p className="font-medium">{order.customers.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Order #{order.order_number} · {pcs} pcs
                    </p>
                  </div>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isFailed
                        ? "bg-destructive/10 text-destructive"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {isFailed ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Summary */}
          <div className="flex gap-4 text-sm">
            <span className="font-medium text-green-700">
              {deliveredCount} delivered
            </span>
            {failedCount > 0 && (
              <span className="font-medium text-destructive">
                {failedCount} returned
              </span>
            )}
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Completing…" : "Confirm Completion"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
