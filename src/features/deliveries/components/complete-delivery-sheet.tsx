"use client";

import { useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type {
  DeliveryOrderSummary,
  DeliveryOutcome,
  OrderOutcome,
} from "../api/deliveries";
import { friendlyError } from "@/lib/db-error";
import { useCompleteDelivery } from "../hooks/use-complete-delivery";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryId: string;
  orders: DeliveryOrderSummary[];
}

type OutcomeOption = {
  value: DeliveryOutcome;
  label: string;
  group: "delivered" | "requeue" | "terminal";
};

const OUTCOME_OPTIONS: OutcomeOption[] = [
  { value: "delivered", label: "Delivered", group: "delivered" },
  { value: "customer_not_home", label: "Customer not home", group: "requeue" },
  { value: "wrong_address", label: "Wrong address", group: "requeue" },
  { value: "other", label: "Other (re-try)", group: "requeue" },
  { value: "customer_refused", label: "Customer refused", group: "terminal" },
  {
    value: "customer_cancelled",
    label: "Customer cancelled",
    group: "terminal",
  },
];

const GROUP_STYLES = {
  delivered: "bg-success-bg/60",
  requeue: "bg-warn-bg/40",
  terminal: "bg-danger-bg/40",
} as const;

const OUTCOME_BADGE = {
  delivered: "text-success-tx",
  requeue: "text-warn-tx",
  terminal: "text-danger-tx",
} as const;

function outcomeGroup(outcome: DeliveryOutcome) {
  return OUTCOME_OPTIONS.find((o) => o.value === outcome)?.group ?? "delivered";
}

type OrderState = {
  outcome: DeliveryOutcome;
  notes: string;
};

export function CompleteDeliverySheet({
  open,
  onOpenChange,
  deliveryId,
  orders,
}: Props) {
  const mutation = useCompleteDelivery(deliveryId);

  const [stateMap, setStateMap] = useState<Map<string, OrderState>>(
    () =>
      new Map(orders.map((o) => [o.id, { outcome: "delivered", notes: "" }])),
  );
  const [error, setError] = useState<string | null>(null);

  function setOutcome(orderId: string, outcome: DeliveryOutcome) {
    setStateMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(orderId) ?? { outcome: "delivered", notes: "" };
      next.set(orderId, { ...existing, outcome });
      return next;
    });
  }

  function setNotes(orderId: string, notes: string) {
    setStateMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(orderId) ?? { outcome: "delivered", notes: "" };
      next.set(orderId, { ...existing, notes });
      return next;
    });
  }

  function handleOpen(isOpen: boolean) {
    if (!isOpen) {
      setStateMap(
        new Map(orders.map((o) => [o.id, { outcome: "delivered", notes: "" }])),
      );
      setError(null);
      mutation.reset();
    }
    onOpenChange(isOpen);
  }

  function handleConfirm() {
    setError(null);
    const outcomes: OrderOutcome[] = orders.map((order) => {
      const s = stateMap.get(order.id) ?? { outcome: "delivered", notes: "" };
      return {
        order_id: order.id,
        outcome: s.outcome,
        notes: s.notes.trim() || null,
      };
    });
    mutation.mutate(outcomes, {
      onSuccess: () => handleOpen(false),
      onError: (err) => setError(friendlyError(err)),
    });
  }

  const counts = orders.reduce(
    (acc, o) => {
      const group = outcomeGroup(stateMap.get(o.id)?.outcome ?? "delivered");
      acc[group]++;
      return acc;
    },
    { delivered: 0, requeue: 0, terminal: 0 },
  );

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Complete Delivery</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          <p className="text-sm text-muted-foreground">
            Set the result for each order. Defaults to Delivered — only change
            exceptions.
          </p>

          <ul className="divide-y rounded-lg border overflow-hidden">
            {orders.map((order) => {
              const pcs = order.order_lines.reduce((s, l) => s + l.quantity, 0);
              const state = stateMap.get(order.id) ?? {
                outcome: "delivered" as DeliveryOutcome,
                notes: "",
              };
              const group = outcomeGroup(state.outcome);

              return (
                <li
                  key={order.id}
                  className={cn("transition-colors", GROUP_STYLES[group])}
                >
                  <div className="p-3 space-y-2">
                    {/* Customer + order info */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium leading-snug">
                          {order.customers.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Order #{order.order_number} · {pcs} pcs
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          OUTCOME_BADGE[group],
                        )}
                      >
                        {OUTCOME_OPTIONS.find((o) => o.value === state.outcome)
                          ?.label ?? state.outcome}
                      </span>
                    </div>

                    {/* Outcome selector */}
                    <select
                      value={state.outcome}
                      onChange={(e) =>
                        setOutcome(order.id, e.target.value as DeliveryOutcome)
                      }
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <optgroup label="Success">
                        <option value="delivered">Delivered</option>
                      </optgroup>
                      <optgroup label="Re-queue (try again)">
                        <option value="customer_not_home">
                          Customer not home
                        </option>
                        <option value="wrong_address">Wrong address</option>
                        <option value="other">Other (re-try)</option>
                      </optgroup>
                      <optgroup label="Terminal (release stock)">
                        <option value="customer_refused">
                          Customer refused
                        </option>
                        <option value="customer_cancelled">
                          Customer cancelled
                        </option>
                      </optgroup>
                    </select>

                    {/* Notes — visible for non-delivered outcomes */}
                    {state.outcome !== "delivered" && (
                      <textarea
                        placeholder="Notes (optional)"
                        value={state.notes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setNotes(order.id, e.target.value)
                        }
                        className="flex min-h-15 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Summary */}
          <div className="flex gap-4 text-sm font-medium">
            {counts.delivered > 0 && (
              <span className="text-success-tx">
                {counts.delivered} delivered
              </span>
            )}
            {counts.requeue > 0 && (
              <span className="text-warn-tx">
                {counts.requeue} returning to queue
              </span>
            )}
            {counts.terminal > 0 && (
              <span className="text-danger-tx">
                {counts.terminal} refused/cancelled
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
