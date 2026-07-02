"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  useCreateCustomer,
  useUpdateCustomer,
} from "../hooks/use-customer-mutations";
import { customerSchema } from "../schemas";
import type { CustomerRow } from "../api/customers";

interface AddProps {
  mode: "add";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditProps {
  mode: "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerRow;
}

type Props = AddProps | EditProps;

export function CustomerSheet(props: Props) {
  const { mode, open, onOpenChange } = props;
  const customer = mode === "edit" ? props.customer : null;

  const [name, setName] = useState(customer?.name ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [notes, setNotes] = useState(customer?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateCustomer();
  const update = useUpdateCustomer(customer?.id ?? "");
  const mutation = mode === "add" ? create : update;

  useEffect(() => {
    if (open) {
      setName(customer?.name ?? "");
      setAddress(customer?.address ?? "");
      setPhone(customer?.phone ?? "");
      setNotes(customer?.notes ?? "");
      setError(null);
    }
  }, [open, customer]);

  function reset() {
    setName("");
    setAddress("");
    setPhone("");
    setNotes("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = customerSchema.safeParse({
      name,
      address,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    mutation.mutate(result.data, {
      onSuccess: () => {
        if (mode === "add") reset();
        onOpenChange(false);
      },
      onError: (err) => setError(err.message),
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && mode === "add") reset();
        onOpenChange(o);
      }}
    >
      <SheetContent side="bottom">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>
              {mode === "add" ? "New Customer" : "Edit Customer"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="cs-name">Name</Label>
              <Input
                id="cs-name"
                placeholder="e.g. Fatma Ali"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={mode === "add"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cs-address">Address</Label>
              <Input
                id="cs-address"
                placeholder="e.g. 12 Tahrir St, Cairo"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cs-phone">
                Phone <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="cs-phone"
                inputMode="tel"
                placeholder="e.g. 01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cs-notes">
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="cs-notes"
                placeholder="Any notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <SheetFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
