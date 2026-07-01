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
import { useProducts } from "@/features/listings/hooks/use-products";
import { useVariants } from "@/features/listings/hooks/use-variants";
import { getErrorMessage } from "@/lib/get-error-message";
import { useAddAvailableStock } from "../hooks/use-available-stock";
import { addStockSchema, STOCK_REASONS, STOCK_REASON_LABELS } from "../schemas";
import type { StockReason } from "../schemas";

export function AddStockSheet({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const isControlled =
    controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<StockReason | "">("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: products = [] } = useProducts();
  const { data: variants = [] } = useVariants(productId);

  const addStock = useAddAvailableStock();

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedVariant = variants.find((v) => v.id === variantId);
  const selectedReasonLabel = reason ? STOCK_REASON_LABELS[reason] : undefined;

  function reset() {
    setProductId("");
    setVariantId("");
    setQuantity("");
    setReason("");
    setNotes("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = addStockSchema.safeParse({
      variant_id: variantId,
      quantity: parseInt(quantity, 10),
      reason: reason || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    try {
      await addStock.mutateAsync(parsed.data);
      reset();
      setOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add stock"));
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <SheetTrigger render={<Button size="sm" />}>
          + Add to Stock
        </SheetTrigger>
      )}

      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add to Stock</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 px-4 pb-8">
          {/* Product */}
          <div className="space-y-2">
            <Label htmlFor="stock_product">Product</Label>
            <Select
              value={productId}
              onValueChange={(v) => {
                setProductId(v ?? "");
                setVariantId("");
              }}
            >
              <SelectTrigger id="stock_product">
                {selectedProduct ? selectedProduct.name : "Select product…"}
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variant */}
          <div className="space-y-2">
            <Label htmlFor="stock_variant">Variant</Label>
            <Select
              value={variantId}
              onValueChange={(v) => setVariantId(v ?? "")}
              disabled={!productId || variants.length === 0}
            >
              <SelectTrigger id="stock_variant">
                {selectedVariant ? selectedVariant.name : "Select variant…"}
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {productId && variants.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No variants found for this product.
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="stock_qty">Quantity</Label>
            <Input
              id="stock_qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="stock_reason">Reason</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason((v as StockReason) ?? "")}
            >
              <SelectTrigger id="stock_reason">
                {selectedReasonLabel ?? "Select reason…"}
              </SelectTrigger>
              <SelectContent>
                {STOCK_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {STOCK_REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="stock_notes">Notes (optional)</Label>
            <Input
              id="stock_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details…"
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
              disabled={addStock.isPending}
              className="flex-1"
            >
              {addStock.isPending ? "Adding…" : "Add to Stock"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={addStock.isPending}
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
