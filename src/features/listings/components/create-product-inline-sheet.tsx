"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/get-error-message";
import { useCreateProductWithVariants } from "../hooks/use-product-mutations";
import { createProductSchema } from "../schemas";
import { z } from "zod";

// ── Variant row schema (prices entered as EGP decimal strings) ────────────────

const variantRowSchema = z.object({
  name: z
    .string()
    .min(1, "Variant name is required")
    .max(100, "Variant name must be 100 characters or fewer"),
  sku: z.string().max(50, "SKU must be 50 characters or fewer").optional(),
  cost_egp: z
    .string()
    .min(1, "Cost price is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: "Cost price must be a non-negative number",
    }),
  selling_egp: z
    .string()
    .min(1, "Selling price is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: "Selling price must be a non-negative number",
    }),
});

const formSchema = createProductSchema.extend({
  variants: z
    .array(variantRowSchema)
    .min(1, "At least one variant is required"),
});

type VariantRow = {
  id: number;
  name: string;
  sku: string;
  cost_egp: string;
  selling_egp: string;
};

function egpToPiastres(egp: string): number {
  return Math.round(parseFloat(egp) * 100);
}

let nextId = 1;
function makeRow(): VariantRow {
  return { id: nextId++, name: "", sku: "", cost_egp: "", selling_egp: "" };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateProductInlineSheet({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (product: { id: string; name: string }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([makeRow()]);
  const [error, setError] = useState<string | null>(null);

  const createProduct = useCreateProductWithVariants();

  function reset() {
    setName("");
    setDescription("");
    setImageUrl("");
    setVariants([makeRow()]);
    setError(null);
  }

  function addVariant() {
    setVariants((prev) => [...prev, makeRow()]);
  }

  function removeVariant(id: number) {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  function updateVariant(
    id: number,
    field: keyof Omit<VariantRow, "id">,
    value: string,
  ) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = formSchema.safeParse({
      name,
      description: description || undefined,
      image_url: imageUrl || undefined,
      is_active: true,
      variants,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    try {
      const product = await createProduct.mutateAsync({
        name: parsed.data.name,
        description: parsed.data.description,
        image_url: parsed.data.image_url,
        is_active: parsed.data.is_active,
        variants: parsed.data.variants.map((v) => ({
          name: v.name,
          sku: v.sku || undefined,
          cost_price: egpToPiastres(v.cost_egp),
          selling_price: egpToPiastres(v.selling_egp),
        })),
      });

      onSuccess(product);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create product"));
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Product</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 px-4 pb-8">
          {/* ── Product fields ── */}
          <div className="space-y-2">
            <Label htmlFor="p_name">Product name</Label>
            <Input
              id="p_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Dress"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="p_desc">Description (optional)</Label>
            <textarea
              id="p_desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description…"
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="p_image">Image URL (optional)</Label>
            <Input
              id="p_image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <Separator />

          {/* ── Variants ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Variants</Label>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
              >
                <Plus className="h-3.5 w-3.5" />
                Add variant
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={v.id}
                  className="rounded-md border px-3 py-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Variant {idx + 1}
                    </span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(v.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove variant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`v_name_${v.id}`} className="text-xs">
                      Name
                    </Label>
                    <Input
                      id={`v_name_${v.id}`}
                      value={v.name}
                      onChange={(e) =>
                        updateVariant(v.id, "name", e.target.value)
                      }
                      placeholder="e.g. Red / M"
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`v_sku_${v.id}`} className="text-xs">
                      SKU (optional)
                    </Label>
                    <Input
                      id={`v_sku_${v.id}`}
                      value={v.sku}
                      onChange={(e) =>
                        updateVariant(v.id, "sku", e.target.value)
                      }
                      placeholder="e.g. DRS-RED-M"
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`v_cost_${v.id}`} className="text-xs">
                        Cost (EGP)
                      </Label>
                      <Input
                        id={`v_cost_${v.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.cost_egp}
                        onChange={(e) =>
                          updateVariant(v.id, "cost_egp", e.target.value)
                        }
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`v_sell_${v.id}`} className="text-xs">
                        Selling (EGP)
                      </Label>
                      <Input
                        id={`v_sell_${v.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.selling_egp}
                        onChange={(e) =>
                          updateVariant(v.id, "selling_egp", e.target.value)
                        }
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              className="flex-1"
              disabled={createProduct.isPending}
            >
              {createProduct.isPending ? "Creating…" : "Create Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={createProduct.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
