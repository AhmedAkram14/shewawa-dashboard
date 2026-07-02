"use client";

import { useState } from "react";

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

import { useCreateVariant } from "../hooks/use-product-mutations";
import { variantSchema } from "../schemas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  businessId: string;
}

export function AddVariantSheet({
  open,
  onOpenChange,
  productId,
  businessId,
}: Props) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateVariant(productId, businessId);

  function reset() {
    setName("");
    setSku("");
    setCostPrice("");
    setSellingPrice("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = variantSchema.safeParse({
      name,
      sku: sku.trim() || undefined,
      cost_price_egp: costPrice,
      selling_price_egp: sellingPrice,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    create.mutate(result.data, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
      onError: (err) => setError(err.message),
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <SheetContent side="bottom">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>Add Variant</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="av-name">Name</Label>
              <Input
                id="av-name"
                placeholder="e.g. Red / Size M"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="av-sku">
                SKU <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="av-sku"
                placeholder="e.g. SW-RED-M"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="av-cost">Cost (EGP)</Label>
                <Input
                  id="av-cost"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="av-sell">Selling (EGP)</Label>
                <Input
                  id="av-sell"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <SheetFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={create.isPending}
            >
              {create.isPending ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
