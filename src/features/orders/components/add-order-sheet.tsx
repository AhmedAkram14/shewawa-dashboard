"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useCreateCustomer } from "@/features/customers/hooks/use-customer-mutations";
import { useVariants } from "@/features/listings/hooks/use-variants";
import { useCreateOrder } from "../hooks/use-order-mutations";
import { createOrderSchema } from "../schemas";
import { createCustomerSchema } from "@/features/customers/schemas";
import { getErrorMessage } from "@/lib/get-error-message";
import type { ListingWithRelations } from "@/features/listings/api/listings";

type CustomerMode = "existing" | "new";

export function AddOrderSheet({ listing }: { listing: ListingWithRelations }) {
  const [open, setOpen] = useState(false);
  const [customerMode, setCustomerMode] = useState<CustomerMode>("existing");
  const [customerId, setCustomerId] = useState("");
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: customers = [] } = useCustomers();
  const { data: variants = [] } = useVariants(listing.catalog_product_id);
  const createCustomer = useCreateCustomer();
  const createOrder = useCreateOrder(listing.id);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedVariant = variants.find((v) => v.id === variantId);
  const unitPrice = selectedVariant?.selling_price ?? 0;

  function reset() {
    setCustomerMode("existing");
    setCustomerId("");
    setNewName("");
    setNewAddress("");
    setNewPhone("");
    setVariantId("");
    setQuantity("1");
    setNotes("");
    setError(null);
  }

  function toggleCustomerMode() {
    setCustomerMode((m) => (m === "existing" ? "new" : "existing"));
    setCustomerId("");
    setNewName("");
    setNewAddress("");
    setNewPhone("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    let resolvedCustomerId = customerId;

    if (customerMode === "new") {
      const customerParse = createCustomerSchema.safeParse({
        name: newName,
        address: newAddress,
        phone: newPhone || undefined,
      });
      if (!customerParse.success) {
        setError(customerParse.error.issues[0].message);
        return;
      }
      try {
        const created = await createCustomer.mutateAsync(customerParse.data);
        resolvedCustomerId = created.id;
      } catch (err) {
        setError(getErrorMessage(err, "Failed to create customer"));
        return;
      }
    }

    const orderParse = createOrderSchema.safeParse({
      listing_id: listing.id,
      customer_id: resolvedCustomerId,
      variant_id: variantId,
      quantity: parseInt(quantity, 10),
      unit_price: unitPrice,
      notes: notes || undefined,
    });
    if (!orderParse.success) {
      setError(orderParse.error.issues[0].message);
      return;
    }

    try {
      await createOrder.mutateAsync(orderParse.data);
      reset();
      setOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create order"));
    }
  }

  const isPending = createCustomer.isPending || createOrder.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>Add Order</SheetTrigger>

      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Order</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 px-4 pb-8">
          {/* Customer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Customer</Label>
              <button
                type="button"
                className="text-xs text-primary underline-offset-2 hover:underline"
                onClick={toggleCustomerMode}
              >
                {customerMode === "existing"
                  ? "+ New customer"
                  : "Select existing"}
              </button>
            </div>

            {customerMode === "existing" ? (
              <Select
                value={customerId}
                onValueChange={(v) => setCustomerId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <span
                    className={`flex flex-1 text-left text-sm ${!selectedCustomer ? "text-muted-foreground" : ""}`}
                  >
                    {selectedCustomer
                      ? selectedCustomer.name
                      : "Select customer…"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No customers yet. Switch to &quot;New customer&quot;.
                    </div>
                  )}
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-3 rounded-md border p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new_name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="new_name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Customer name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new_address" className="text-xs">
                    Address
                  </Label>
                  <Input
                    id="new_address"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Delivery address"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new_phone" className="text-xs">
                    Phone (optional)
                  </Label>
                  <Input
                    id="new_phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+20 1xx xxx xxxx"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Variant */}
          <div className="space-y-2">
            <Label>Variant</Label>
            <Select
              value={variantId}
              onValueChange={(v) => setVariantId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <span
                  className={`flex flex-1 text-left text-sm ${!selectedVariant ? "text-muted-foreground" : ""}`}
                >
                  {selectedVariant
                    ? `${selectedVariant.name} — EGP ${(selectedVariant.selling_price / 100).toFixed(2)}`
                    : "Select variant…"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} — EGP {(v.selling_price / 100).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="order_quantity">Quantity</Label>
            <Input
              id="order_quantity"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Unit price — read-only snapshot */}
          {selectedVariant && (
            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Unit price</span>
              <span className="font-medium">
                EGP {(unitPrice / 100).toFixed(2)}
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="order_notes">Notes (optional)</Label>
            <Input
              id="order_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special requests…"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Saving…" : "Add Order"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
