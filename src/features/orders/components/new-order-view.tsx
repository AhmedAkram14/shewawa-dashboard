"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";

import { getProductsForPicker } from "../api/orders";
import { useCreateOrder } from "../hooks/use-create-order";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { CustomerSheet } from "@/features/customers/components/customer-sheet";
import type { CustomerRow } from "@/features/customers/api/customers";
import { LinePickerSheet } from "./line-picker-sheet";

type DraftLine = {
  product_variant_id: string;
  quantity: number;
  unit_price: number;
  variantName: string;
  productName: string;
};

export function NewOrderView() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(
    null,
  );
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [depositEgp, setDepositEgp] = useState("");
  const [notes, setNotes] = useState("");
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-picker"],
    queryFn: () => getProductsForPicker(createClient()),
  });
  const createOrder = useCreateOrder();

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const depositPiastres = Math.round((parseFloat(depositEgp) || 0) * 100);
  const balance = Math.max(0, subtotal - depositPiastres);

  function addOrMergeLine(
    variantId: string,
    qty: number,
    unitPrice: number,
    variantName: string,
    productName: string,
  ) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.product_variant_id === variantId);
      if (idx !== -1) {
        return prev.map((l, i) =>
          i === idx ? { ...l, quantity: l.quantity + qty } : l,
        );
      }
      return [
        ...prev,
        {
          product_variant_id: variantId,
          quantity: qty,
          unit_price: unitPrice,
          variantName,
          productName,
        },
      ];
    });
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    setError(null);
    if (!selectedCustomer) {
      setError("Please select a customer");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one item");
      return;
    }
    createOrder.mutate(
      {
        customer_id: selectedCustomer.id,
        deposit_amount: depositPiastres,
        notes: notes.trim() || null,
        lines: lines.map(({ product_variant_id, quantity, unit_price }) => ({
          product_variant_id,
          quantity,
          unit_price,
        })),
      },
      { onError: (err) => setError(err.message) },
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold leading-tight">New Order</h1>
      </div>

      {/* Customer */}
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Customer
        </p>
        {selectedCustomer ? (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">{selectedCustomer.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedCustomer.address}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCustomerPickerOpen(true)}
            >
              Change
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setCustomerPickerOpen(true)}
          >
            Select Customer
          </Button>
        )}
      </section>

      {/* Order lines */}
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Items
        </p>
        {lines.length > 0 && (
          <ul className="mb-3 divide-y rounded-lg border">
            {lines.map((line, i) => (
              <li
                key={line.product_variant_id}
                className="flex items-center justify-between p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{line.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.variantName} · {line.quantity} × EGP{" "}
                    {formatPrice(line.unit_price)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-sm font-medium">
                    EGP {formatPrice(line.quantity * line.unit_price)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeLine(i)}
                    aria-label={`Remove ${line.productName}`}
                  >
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setPickerOpen(true)}
        >
          <Plus />
          Add Item
        </Button>
      </section>

      {/* Totals */}
      <section className="divide-y rounded-lg border">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-sm font-medium">
            EGP {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 p-3">
          <Label
            htmlFor="deposit-input"
            className="text-sm text-muted-foreground font-normal shrink-0"
          >
            Deposit
          </Label>
          <Input
            id="deposit-input"
            inputMode="decimal"
            placeholder="0.00"
            value={depositEgp}
            onChange={(e) => setDepositEgp(e.target.value)}
            className="w-32 text-right"
          />
        </div>
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">Balance Due</span>
          <span className="text-sm font-semibold">
            EGP {formatPrice(balance)}
          </span>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-1.5">
        <Label htmlFor="order-notes">
          Notes{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="order-notes"
          placeholder="Any notes for this order"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={createOrder.isPending}
      >
        {createOrder.isPending ? "Placing Order…" : "Place Order"}
      </Button>

      {/* Customer picker sheet */}
      <Sheet open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Select Customer</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <Button
              variant="outline"
              onClick={() => {
                setCustomerPickerOpen(false);
                setCustomerSheetOpen(true);
              }}
            >
              <Plus />
              New Customer
            </Button>
            {customers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No customers yet
              </p>
            ) : (
              <ul className="max-h-80 divide-y overflow-y-auto">
                {customers.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerPickerOpen(false);
                      }}
                      className="flex w-full flex-col items-start py-3 text-left transition-colors hover:text-foreground"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.address}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* New customer sheet */}
      <CustomerSheet
        mode="add"
        open={customerSheetOpen}
        onOpenChange={setCustomerSheetOpen}
      />

      {/* Line picker sheet */}
      <LinePickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        products={products}
        onAdd={addOrMergeLine}
      />
    </div>
  );
}
