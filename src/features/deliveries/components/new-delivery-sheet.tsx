"use client";

import { Check, PackageCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useReadyOrders } from "../hooks/use-deliveries";
import { friendlyError } from "@/lib/db-error";
import { useCreateDelivery } from "../hooks/use-create-delivery";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewDeliverySheet({ open, onOpenChange }: Props) {
  const { data: readyOrders = [] } = useReadyOrders();
  const mutation = useCreateDelivery();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleOpen(isOpen: boolean) {
    if (!isOpen) {
      setSelected(new Set());
      setNotes("");
      setError(null);
    }
    onOpenChange(isOpen);
  }

  function handleCreate() {
    setError(null);
    if (selected.size === 0) {
      setError("Select at least one order");
      return;
    }
    mutation.mutate(
      { order_ids: Array.from(selected), notes: notes.trim() || null },
      { onError: (err) => setError(friendlyError(err)) },
    );
  }

  const totalPcs = readyOrders
    .filter((o) => selected.has(o.id))
    .reduce(
      (sum, o) => sum + o.order_lines.reduce((s, l) => s + l.quantity, 0),
      0,
    );

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Delivery</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          {readyOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <PackageCheck className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No orders are ready for delivery yet.
              </p>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {readyOrders.map((order) => {
                const pcs = order.order_lines.reduce(
                  (s, l) => s + l.quantity,
                  0,
                );
                const isSelected = selected.has(order.id);
                return (
                  <li
                    key={order.id}
                    className={`flex cursor-pointer items-center gap-3 p-3 transition-colors ${
                      isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                    onClick={() => toggle(order.id)}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <p className="font-medium">{order.customers.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Order #{order.order_number}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {pcs} pcs
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Summary */}
          <div className="divide-y rounded-lg border">
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">
                Selected Orders
              </span>
              <span className="text-sm font-medium">{selected.size}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">Total Pcs</span>
              <span className="text-sm font-medium">{totalPcs}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="delivery-notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="delivery-notes"
              placeholder="Any notes for this delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={mutation.isPending || selected.size === 0}
          >
            {mutation.isPending ? "Creating…" : "Create Delivery"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
