"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { DeliveryOrderSummary } from "../api/deliveries";
import { friendlyError } from "@/lib/db-error";
import { useCompleteDelivery } from "../hooks/use-complete-delivery";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryId: string;
  orders: DeliveryOrderSummary[];
}

type FailedData = {
  failure_reason: string;
  courier_notes: string;
};

const FAILURE_REASONS = [
  { value: "customer_not_home", label: "Customer not home" },
  { value: "no_answer", label: "No answer" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "refused", label: "Refused delivery" },
  { value: "other", label: "Other" },
] as const;

export function CompleteDeliverySheet({
  open,
  onOpenChange,
  deliveryId,
  orders,
}: Props) {
  const mutation = useCompleteDelivery(deliveryId);
  const [failedMap, setFailedMap] = useState<Map<string, FailedData>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);

  function toggle(orderId: string) {
    setFailedMap((prev) => {
      const next = new Map(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.set(orderId, { failure_reason: "", courier_notes: "" });
      }
      return next;
    });
  }

  function updateField(
    orderId: string,
    field: keyof FailedData,
    value: string,
  ) {
    setFailedMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(orderId);
      if (existing) next.set(orderId, { ...existing, [field]: value });
      return next;
    });
  }

  function handleOpen(isOpen: boolean) {
    if (!isOpen) {
      setFailedMap(new Map());
      setError(null);
      mutation.reset();
    }
    onOpenChange(isOpen);
  }

  function handleConfirm() {
    setError(null);
    const failedOrders = Array.from(failedMap.entries()).map(
      ([order_id, data]) => ({
        order_id,
        failure_reason: data.failure_reason || null,
        courier_notes: data.courier_notes.trim() || null,
      }),
    );
    mutation.mutate(
      { failedOrders },
      {
        onSuccess: () => handleOpen(false),
        onError: (err) => setError(friendlyError(err)),
      },
    );
  }

  const failedCount = failedMap.size;
  const deliveredCount = orders.length - failedCount;

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Complete Delivery</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          <p className="text-sm text-muted-foreground">
            Tap an order to mark it as returned. Returned orders go back to the
            ready queue with allocations intact.
          </p>

          <ul className="divide-y rounded-lg border overflow-hidden">
            {orders.map((order) => {
              const pcs = order.order_lines.reduce((s, l) => s + l.quantity, 0);
              const isFailed = failedMap.has(order.id);
              const data = failedMap.get(order.id);

              return (
                <li
                  key={order.id}
                  className={isFailed ? "bg-destructive/5" : "bg-success-bg/50"}
                >
                  {/* Order row — tap to toggle */}
                  <div
                    className="flex cursor-pointer items-center justify-between p-3"
                    onClick={() => toggle(order.id)}
                  >
                    <div>
                      <p className="font-medium">{order.customers.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.order_number} · {pcs} pcs
                      </p>
                    </div>
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isFailed
                          ? "bg-destructive/10 text-destructive"
                          : "bg-success-bg text-success-tx"
                      }`}
                    >
                      {isFailed ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {/* Expanded fields for failed orders */}
                  {isFailed && data && (
                    <div
                      className="space-y-2 border-t border-destructive/10 px-3 pb-3 pt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={data.failure_reason}
                        onChange={(e) =>
                          updateField(
                            order.id,
                            "failure_reason",
                            e.target.value,
                          )
                        }
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Reason (optional)</option>
                        {FAILURE_REASONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Courier notes (optional)"
                        value={data.courier_notes}
                        onChange={(e) =>
                          updateField(order.id, "courier_notes", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Live summary */}
          <div className="flex gap-4 text-sm">
            <span className="font-medium text-success-tx">
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
