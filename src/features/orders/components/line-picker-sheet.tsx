"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";

import type { ProductForPicker } from "../api/orders";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductForPicker[];
  onAdd: (
    variantId: string,
    qty: number,
    unitPrice: number,
    variantName: string,
    productName: string,
  ) => void;
}

type Stage = "product" | "variant";

export function LinePickerSheet({
  open,
  onOpenChange,
  products,
  onAdd,
}: Props) {
  const [stage, setStage] = useState<Stage>("product");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductForPicker | null>(null);
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (open) {
      setStage("product");
      setSelectedProduct(null);
      setQuantity("1");
    }
  }, [open]);

  function handleSelectProduct(product: ProductForPicker) {
    setSelectedProduct(product);
    setStage("variant");
    setQuantity("1");
  }

  function handleSelectVariant(
    variant: ProductForPicker["product_variants"][number],
  ) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    onAdd(
      variant.id,
      qty,
      variant.selling_price,
      variant.name,
      selectedProduct!.name,
    );
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>
            {stage === "product" ? "Select Product" : selectedProduct?.name}
          </SheetTitle>
        </SheetHeader>

        {stage === "product" ? (
          <ul className="divide-y px-4">
            {products.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                No active products
              </li>
            )}
            {products.map((product) => (
              <li key={product.id}>
                <button
                  onClick={() => handleSelectProduct(product)}
                  className="flex w-full items-center justify-between py-3 text-left transition-colors hover:text-foreground"
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {product.product_variants.length}{" "}
                    {product.product_variants.length === 1
                      ? "variant"
                      : "variants"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            <button
              onClick={() => setStage("product")}
              className="flex items-center gap-1 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to products
            </button>

            <div className="space-y-1.5">
              <Label htmlFor="lp-qty">Quantity</Label>
              <Input
                id="lp-qty"
                type="number"
                inputMode="numeric"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-28"
                autoFocus
              />
            </div>

            <ul className="divide-y">
              {selectedProduct?.product_variants.map((variant) => (
                <li key={variant.id}>
                  <button
                    onClick={() => handleSelectVariant(variant)}
                    className="flex w-full items-center justify-between py-3 text-left transition-colors hover:text-foreground"
                  >
                    <span className="font-medium">{variant.name}</span>
                    <span className="text-sm text-muted-foreground">
                      EGP {formatPrice(variant.selling_price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
