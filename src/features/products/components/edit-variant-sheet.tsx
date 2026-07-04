"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";

import {
  useDeleteVariant,
  useUpdateVariant,
} from "../hooks/use-product-mutations";
import { variantSchema } from "../schemas";
import { friendlyError } from "@/lib/db-error";
import type { Database } from "@/lib/supabase/database.types";

type Variant = Database["public"]["Tables"]["product_variants"]["Row"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: Variant;
  productId: string;
}

export function EditVariantSheet({
  open,
  onOpenChange,
  variant,
  productId,
}: Props) {
  const [name, setName] = useState(variant.name);
  const [sku, setSku] = useState(variant.sku ?? "");
  const [costPrice, setCostPrice] = useState(formatPrice(variant.cost_price));
  const [sellingPrice, setSellingPrice] = useState(
    formatPrice(variant.selling_price),
  );
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateVariant(productId);
  const remove = useDeleteVariant(productId);

  useEffect(() => {
    if (open) {
      setName(variant.name);
      setSku(variant.sku ?? "");
      setCostPrice(formatPrice(variant.cost_price));
      setSellingPrice(formatPrice(variant.selling_price));
      setError(null);
    }
  }, [open, variant]);

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
    update.mutate(
      { id: variant.id, input: result.data },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setError(friendlyError(err)),
      },
    );
  }

  function handleDelete() {
    remove.mutate(variant.id, {
      onSuccess: () => onOpenChange(false),
      onError: (err) => setError(friendlyError(err)),
    });
  }

  const busy = update.isPending || remove.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>Edit Variant</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="ev-name">Name</Label>
              <Input
                id="ev-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-sku">
                SKU <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="ev-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ev-cost">Cost (EGP)</Label>
                <Input
                  id="ev-cost"
                  inputMode="decimal"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-sell">Selling (EGP)</Label>
                <Input
                  id="ev-sell"
                  inputMode="decimal"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <SheetFooter className="gap-2">
            <Button type="submit" className="w-full" disabled={busy}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
            <Separator />
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={busy}
              onClick={handleDelete}
            >
              {remove.isPending ? "Deleting…" : "Delete variant"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
