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
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCreateCustomer } from "../hooks/use-customer-mutations";
import { createCustomerSchema } from "../schemas";

export function AddCustomerSheet() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createCustomer = useCreateCustomer();

  function reset() {
    setName("");
    setAddress("");
    setPhone("");
    setNotes("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = createCustomerSchema.safeParse({
      name,
      address,
      phone: phone || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    try {
      await createCustomer.mutateAsync(parsed.data);
      reset();
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create customer",
      );
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>Add Customer</SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New Customer</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 px-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Name</Label>
            <Input
              id="customer_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_address">Address</Label>
            <Input
              id="customer_address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Delivery address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_phone">Phone (optional)</Label>
            <Input
              id="customer_phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+20 1xx xxx xxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_notes">Notes (optional)</Label>
            <Input
              id="customer_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this customer"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={createCustomer.isPending}
          >
            {createCustomer.isPending ? "Saving…" : "Add Customer"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
