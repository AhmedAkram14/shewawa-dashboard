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
import { formatPrice } from "@/lib/format";

import type { OrderDetail } from "../api/orders";
import { useUpdateOrder } from "../hooks/use-update-order";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
  canEditLines: boolean;
}

export function EditOrderSheet({
  open,
  onOpenChange,
  order,
  canEditLines: _canEditLines,
}: Props) {
  const subtotal = order.order_lines.reduce(
    (s, l) => s + l.quantity * l.unit_price,
    0,
  );

  const [depositEgp, setDepositEgp] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useUpdateOrder(order.id);

  useEffect(() => {
    if (open) {
      setDepositEgp((order.deposit_amount / 100).toFixed(2));
      setNotes(order.notes ?? "");
      setError(null);
    }
  }, [open, order.deposit_amount, order.notes]);

  const depositPiastres = Math.round(parseFloat(depositEgp || "0") * 100);
  const balance = Math.max(0, subtotal - depositPiastres);

  function handleSave() {
    setError(null);
    if (isNaN(depositPiastres) || depositPiastres < 0) {
      setError("Deposit must be a valid amount");
      return;
    }
    mutation.mutate(
      { deposit_amount: depositPiastres, notes: notes.trim() || null },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setError(err.message),
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Edit Order #{order.order_number}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          {/* Totals with editable deposit */}
          <div className="divide-y rounded-lg border">
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-medium">
                EGP {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3">
              <Label
                htmlFor="edit-deposit"
                className="shrink-0 text-sm font-normal text-muted-foreground"
              >
                Deposit
              </Label>
              <Input
                id="edit-deposit"
                inputMode="decimal"
                placeholder="0.00"
                value={depositEgp}
                onChange={(e) => setDepositEgp(e.target.value)}
                className="w-32 text-right"
              />
            </div>
            <div className="flex justify-between p-3">
              <span className="text-sm font-medium">Balance Due</span>
              <span className="text-sm font-semibold">
                EGP {formatPrice(balance)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="edit-notes"
              placeholder="Any notes for this order"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
