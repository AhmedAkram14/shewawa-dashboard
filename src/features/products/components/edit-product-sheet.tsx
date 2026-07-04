"use client";

import { ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    product.image_url ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const update = useUpdateProduct(product.id);

  useEffect(() => {
    if (open) {
      setName(product.name);
      setDescription(product.description ?? "");
      setImageFile(null);
      setPreviewUrl(product.image_url ?? null);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, product]);

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

    const imageUpdate: { image_url?: string | null; imageFile?: File } = {};
    if (imageFile) {
      imageUpdate.imageFile = imageFile;
    } else if (!previewUrl && product.image_url) {
      imageUpdate.image_url = null;
    }

    update.mutate(
      {
        name: result.data.name,
        description: result.data.description,
        ...imageUpdate,
      },
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

            {/* Image upload */}
            <div className="space-y-1.5">
              <Label>Photo</Label>
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Product photo"
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
