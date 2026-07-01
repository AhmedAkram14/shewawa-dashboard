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
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useProducts } from "../hooks/use-products";
import { useCollections } from "../hooks/use-collections";
import { useCreateListing } from "../hooks/use-listing-mutations";
import { createListingSchema } from "../schemas";

export function CreateListingSheet() {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [closesOn, setClosesOn] = useState("");
  const [threshold, setThreshold] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: products = [] } = useProducts();
  const { data: collections = [] } = useCollections();
  const createListing = useCreateListing();

  const activeProducts = products.filter((p) => p.is_active);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = createListingSchema.safeParse({
      catalog_product_id: productId,
      collection_id: collectionId || undefined,
      closes_on: closesOn ? new Date(closesOn).toISOString() : "",
      threshold: threshold ? parseInt(threshold, 10) : undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    try {
      await createListing.mutateAsync(parsed.data);
      setOpen(false);
      setProductId("");
      setCollectionId("");
      setClosesOn("");
      setThreshold("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* @base-ui uses render prop instead of asChild */}
      <SheetTrigger render={<Button size="sm" />}>New Listing</SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New Listing</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 px-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select
              value={productId}
              onValueChange={(v) => setProductId(v ?? "")}
            >
              <SelectTrigger id="product" className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection">Collection (optional)</Label>
            <Select
              value={collectionId}
              onValueChange={(v) => setCollectionId(v ?? "")}
            >
              <SelectTrigger id="collection" className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closes_on">Closes on</Label>
            <Input
              id="closes_on"
              type="datetime-local"
              value={closesOn}
              onChange={(e) => setClosesOn(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Min. orders threshold (optional)</Label>
            <Input
              id="threshold"
              type="number"
              placeholder="e.g. 50"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              min={1}
              step={1}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={createListing.isPending}
          >
            {createListing.isPending ? "Creating…" : "Create Listing"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
