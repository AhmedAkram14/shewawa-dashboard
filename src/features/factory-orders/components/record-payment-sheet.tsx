"use client";

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
import { friendlyError } from "@/lib/db-error";
import { useRecordFactoryPayment } from "../hooks/use-record-factory-payment";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryOrderId: string;
  factoryName: string;
}

export function RecordPaymentSheet({
  open,
  onOpenChange,
  factoryOrderId,
  factoryName,
}: Props) {
  const [amountEgp, setAmountEgp] = useState("");
  const [paidAt, setPaidAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useRecordFactoryPayment(factoryOrderId);

  function handleSubmit() {
    setError(null);
    const amount = Math.round((parseFloat(amountEgp) || 0) * 100);
    if (amount <= 0) {
      setError("Enter a valid payment amount");
      return;
    }
    if (!paidAt) {
      setError("Enter the payment date");
      return;
    }
    mutation.mutate(
      {
        amount,
        paid_at: paidAt,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setAmountEgp("");
          setReference("");
          setNotes("");
          setPaidAt(new Date().toISOString().slice(0, 10));
          onOpenChange(false);
        },
        onError: (err) => setError(friendlyError(err)),
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="space-y-4 pb-8">
        <SheetHeader>
          <SheetTitle>Record Payment — {factoryName}</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 px-1">
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Amount (EGP)</Label>
            <Input
              id="pay-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amountEgp}
              onChange={(e) => setAmountEgp(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-date">Date paid</Label>
            <Input
              id="pay-date"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-ref">
              Reference{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="pay-ref"
              placeholder="Transfer ref, cheque no., …"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="pay-notes"
              placeholder="Any notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Record Payment"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
