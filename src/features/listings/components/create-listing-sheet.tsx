"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
import { CreateProductInlineSheet } from "./create-product-inline-sheet";
import { getErrorMessage } from "@/lib/get-error-message";

export function CreateListingSheet() {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [closesOn, setClosesOn] = useState("");
  const [threshold, setThreshold] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createProductOpen, setCreateProductOpen] = useState(false);

  const { data: products = [] } = useProducts();
  const { data: collections = [] } = useCollections();
  const createListing = useCreateListing();

  const activeProducts = products.filter((p) => p.is_active);
  const selectedProduct = activeProducts.find((p) => p.id === productId);
  const selectedCollection = collections.find((c) => c.id === collectionId);

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
      setError(getErrorMessage(err, "Failed to create listing"));
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
                <span
                  className={`flex flex-1 text-left text-sm ${!selectedProduct ? "text-muted-foreground" : ""}`}
                >
                  {selectedProduct ? selectedProduct.name : "Select a product"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
                {/* Not a SelectItem — clicking it does not set a value */}
                <div className="border-t mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setCreateProductOpen(true)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent focus:bg-accent outline-none"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create New Product
                  </button>
                </div>
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
                <span
                  className={`flex flex-1 text-left text-sm ${!selectedCollection ? "text-muted-foreground" : ""}`}
                >
                  {selectedCollection ? selectedCollection.name : "None"}
                </span>
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

      {/* Nested sheet — renders in its own portal, above the listing sheet.
          Closing it returns the owner to the listing form with state intact. */}
      <CreateProductInlineSheet
        open={createProductOpen}
        onOpenChange={setCreateProductOpen}
        onSuccess={(product) => {
          setProductId(product.id);
          setCreateProductOpen(false);
        }}
      />
    </Sheet>
  );
}
