"use client";

import { ImageIcon, X } from "lucide-react";
import { useRef, useState } from "react";

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
  useCreateProduct,
  useCreateVariant,
} from "../hooks/use-product-mutations";
import { friendlyError } from "@/lib/db-error";
import { createProductSchema, variantSchema } from "../schemas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * When provided, the sheet adds a second "Add Variant" step after creating
   * the product. On variant save, this callback fires with the new variant's
   * data so the caller can immediately add it to an order line.
   */
  onVariantAdded?: (
    variantId: string,
    sellingPrice: number,
    variantName: string,
    productName: string,
  ) => void;
}

type Step = "product" | "variant";

export function AddProductSheet({ open, onOpenChange, onVariantAdded }: Props) {
  const [step, setStep] = useState<Step>("product");
  const [newProductId, setNewProductId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState("");

  // Step 1 — product fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — variant fields
  const [variantName, setVariantName] = useState("");
  const [sku, setSku] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  const [error, setError] = useState<string | null>(null);

  const createProduct = useCreateProduct();
  const createVariant = useCreateVariant(newProductId ?? "");

  function resetAll() {
    setStep("product");
    setNewProductId(null);
    setNewProductName("");
    setName("");
    setDescription("");
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setVariantName("");
    setSku("");
    setCostPrice("");
    setSellingPrice("");
    setError(null);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = createProductSchema.safeParse({
      name,
      description: description.trim() || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    createProduct.mutate(
      { ...result.data, imageFile: imageFile ?? undefined },
      {
        onSuccess: (product) => {
          if (onVariantAdded) {
            // Two-step mode: move to variant creation
            setNewProductId(product.id);
            setNewProductName(result.data.name);
            setStep("variant");
            setError(null);
          } else {
            resetAll();
            onOpenChange(false);
          }
        },
        onError: (err) => setError(friendlyError(err)),
      },
    );
  }

  function handleVariantSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = variantSchema.safeParse({
      name: variantName,
      sku: sku.trim() || undefined,
      cost_price_egp: costPrice,
      selling_price_egp: sellingPrice,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    createVariant.mutate(result.data, {
      onSuccess: (variant) => {
        onVariantAdded!(
          variant.id,
          variant.selling_price,
          variant.name,
          newProductName,
        );
        resetAll();
        onOpenChange(false);
      },
      onError: (err) => setError(friendlyError(err)),
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAll();
        onOpenChange(o);
      }}
    >
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        {step === "product" ? (
          <form onSubmit={handleProductSubmit} className="flex flex-col gap-4">
            <SheetHeader>
              <SheetTitle>New Product</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="space-y-1.5">
                <Label htmlFor="ap-name">Name</Label>
                <Input
                  id="ap-name"
                  placeholder="e.g. Summer Dress"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ap-desc">
                  Description{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="ap-desc"
                  placeholder="Short description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Photo{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-36 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/40 hover:bg-accent/40">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Tap to upload photo
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <SheetFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={createProduct.isPending}
              >
                {createProduct.isPending
                  ? "Saving…"
                  : onVariantAdded
                    ? "Next: Add Variant →"
                    : "Save"}
              </Button>
            </SheetFooter>
          </form>
        ) : (
          <form onSubmit={handleVariantSubmit} className="flex flex-col gap-4">
            <SheetHeader>
              <SheetTitle>Add Variant — {newProductName}</SheetTitle>
            </SheetHeader>

            <p className="px-4 text-sm text-muted-foreground">
              Add at least one variant so this product can be ordered.
            </p>

            <div className="flex flex-col gap-4 px-4">
              <div className="space-y-1.5">
                <Label htmlFor="av-name">Variant name</Label>
                <Input
                  id="av-name"
                  placeholder="e.g. Black / Size M"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="av-sku">
                  SKU <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="av-sku"
                  placeholder="e.g. SW-BLK-M"
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
                disabled={createVariant.isPending}
              >
                {createVariant.isPending ? "Saving…" : "Save & Add to Order"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
