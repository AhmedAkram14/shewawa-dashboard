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

import { useCreateProduct } from "../hooks/use-product-mutations";
import { createProductSchema } from "../schemas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}

export function AddProductSheet({ open, onOpenChange, businessId }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateProduct(businessId);

  function reset() {
    setName("");
    setDescription("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
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
