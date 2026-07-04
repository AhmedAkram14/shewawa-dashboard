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

import { useCreateProduct } from "../hooks/use-product-mutations";
import { friendlyError } from "@/lib/db-error";
import { createProductSchema } from "../schemas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductSheet({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const create = useCreateProduct();

  function reset() {
    setName("");
    setDescription("");
    setImageFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    create.mutate(
      { ...result.data, imageFile: imageFile ?? undefined },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (err) => setError(friendlyError(err)),
      },
    );
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

            {/* Image upload */}
            <div className="space-y-1.5">
              <Label>
                Photo <span className="text-muted-foreground">(optional)</span>
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
