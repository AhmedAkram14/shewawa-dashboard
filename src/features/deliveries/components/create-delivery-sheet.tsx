"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePackingCustomers } from "../hooks/use-deliveries";
import { useCreateDelivery } from "../hooks/use-delivery-mutations";
import { createDeliverySchema } from "../schemas";
import { getErrorMessage } from "@/lib/get-error-message";
import type { PackingCustomer } from "../api/deliveries";

function formatPrice(piastres: number) {
  return `EGP ${(piastres / 100).toFixed(2)}`;
}

function CustomerOrderList({
  customer,
  selectedOrderIds,
  onToggle,
}: {
  customer: PackingCustomer;
  selectedOrderIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-md border divide-y text-sm">
      {customer.orders.map((o) => (
        <label
          key={o.id}
          className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent/50"
        >
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0"
            checked={selectedOrderIds.includes(o.id)}
            onChange={() => onToggle(o.id)}
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{o.listings.products.name}</p>
            <p className="text-xs text-muted-foreground">
              {o.product_variants.name} · {o.quantity} pcs ·{" "}
              {formatPrice(o.unit_price * o.quantity)}
            </p>
          </div>
        </label>
      ))}
    </div>
  );
}

export function CreateDeliverySheet({
  defaultCustomerId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  defaultCustomerId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: packingCustomers = [], isLoading } = usePackingCustomers();
  const createDelivery = useCreateDelivery();

  // Pre-select customer when opened with a defaultCustomerId
  useEffect(() => {
    if (open && defaultCustomerId && packingCustomers.length > 0) {
      const customer = packingCustomers.find(
        (c) => c.customer.id === defaultCustomerId,
      );
      if (customer) {
        setSelectedCustomerId(defaultCustomerId);
        setSelectedOrderIds(customer.orders.map((o) => o.id));
      }
    }
  }, [open, defaultCustomerId, packingCustomers]);

  const selectedCustomer = packingCustomers.find(
    (c) => c.customer.id === selectedCustomerId,
  );

  function selectCustomer(customerId: string) {
    setSelectedCustomerId(customerId);
    const customer = packingCustomers.find((c) => c.customer.id === customerId);
    setSelectedOrderIds(customer ? customer.orders.map((o) => o.id) : []);
    setError(null);
  }

  function toggleOrder(id: string) {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function reset() {
    setSelectedCustomerId("");
    setSelectedOrderIds([]);
    setNotes("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = createDeliverySchema.safeParse({
      customer_id: selectedCustomerId,
      order_ids: selectedOrderIds,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    try {
      await createDelivery.mutateAsync(parsed.data);
      reset();
      setOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create delivery"));
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <SheetTrigger render={<Button size="sm" />}>
          + New Delivery
        </SheetTrigger>
      )}

      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Delivery</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 px-4 pb-8">
          {/* Customer selection */}
          <div className="space-y-2">
            <Label>Customer</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading ready customers…
              </p>
            ) : packingCustomers.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                No customers with orders ready to pack. Move listings to
                &quot;Ready for Packing&quot; first.
              </p>
            ) : (
              <div className="rounded-md border divide-y text-sm">
                {packingCustomers.map((pc) => (
                  <label
                    key={pc.customer.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent/50"
                  >
                    <input
                      type="radio"
                      name="customer"
                      className="h-4 w-4 shrink-0"
                      checked={selectedCustomerId === pc.customer.id}
                      onChange={() => selectCustomer(pc.customer.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{pc.customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pc.orders.length} order
                        {pc.orders.length !== 1 ? "s" : ""} ready
                        {pc.customer.phone ? ` · ${pc.customer.phone}` : ""}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Orders for selected customer */}
          {selectedCustomer && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Orders to include</Label>
                <CustomerOrderList
                  customer={selectedCustomer}
                  selectedOrderIds={selectedOrderIds}
                  onToggle={toggleOrder}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedOrderIds.length} of {selectedCustomer.orders.length}{" "}
                  selected
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="delivery_notes">Notes (optional)</Label>
            <Input
              id="delivery_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery instructions…"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={
                createDelivery.isPending ||
                !selectedCustomerId ||
                selectedOrderIds.length === 0
              }
              className="flex-1"
            >
              {createDelivery.isPending ? "Creating…" : "Create Delivery"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={createDelivery.isPending}
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
