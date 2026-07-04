"use client";

import { useEffect, useState } from "react";

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

import { useUpdateProduct } from "../hooks/use-product-mutations";
import { updateProductSchema } from "../schemas";
import { friendlyError } from "@/lib/db-error";
import type { ProductWithVariants } from "../api/products";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithVariants;
}

export function EditProductSheet({ open, onOpenChange, product }: Props) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateProduct(product.id);

  useEffect(() => {
    if (open) {
      setName(product.name);
      setDescription(product.description ?? "");
      setError(null);
    }
  }, [open, product]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = updateProductSchema.safeParse({
      name,
      description: description.trim() || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    update.mutate(
      { name: result.data.name, description: result.data.description },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setError(friendlyError(err)),
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>Edit Product</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="ep-name">Name</Label>
              <Input
                id="ep-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ep-desc">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="ep-desc"
                placeholder="Short description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <SheetFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={update.isPending}
            >
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
