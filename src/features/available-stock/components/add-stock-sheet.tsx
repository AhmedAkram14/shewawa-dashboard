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
import { getProductsForPicker } from "@/features/orders/api/orders";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

import { useAddManualStock } from "../hooks/use-add-manual-stock";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStockSheet({ open, onOpenChange }: Props) {
  const mutation = useAddManualStock();

  const { data: products = [] } = useQuery({
    queryKey: ["products", "picker"],
    queryFn: () => getProductsForPicker(createClient()),
    enabled: open,
  });

  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpen(isOpen: boolean) {
    if (!isOpen) {
      setVariantId("");
      setQty("");
      setNotes("");
      setError(null);
      mutation.reset();
    }
    onOpenChange(isOpen);
  }

  function handleAdd() {
    setError(null);
    const q = parseInt(qty, 10);
    if (!variantId) {
      setError("Select a product variant");
      return;
    }
    if (isNaN(q) || q <= 0) {
      setError("Enter a valid quantity");
      return;
    }
    mutation.mutate(
      {
        product_variant_id: variantId,
        quantity: q,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => handleOpen(false),
        onError: (err) => setError(err.message),
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Add Manual Stock</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          {/* Variant picker */}
          <div className="space-y-1.5">
            <Label htmlFor="stock-variant">Product Variant</Label>
            <select
              id="stock-variant"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select a variant…</option>
              {products.map((product) =>
                product.product_variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {product.name} — {v.name}
                  </option>
                )),
              )}
            </select>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="stock-qty">Quantity</Label>
            <Input
              id="stock-qty"
              inputMode="numeric"
              placeholder="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-32"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="stock-notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="stock-notes"
              placeholder="Reason for manual entry"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleAdd}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Adding…" : "Add Stock"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
