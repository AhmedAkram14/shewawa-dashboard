"use client";

import { ChevronLeft, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";

import { AddVariantSheet } from "./add-variant-sheet";
import { EditProductSheet } from "./edit-product-sheet";
import { EditVariantSheet } from "./edit-variant-sheet";
import { useUpdateProduct } from "../hooks/use-product-mutations";
import { useProduct } from "../hooks/use-products";
import type { ProductWithVariants } from "../api/products";

type Variant = Database["public"]["Tables"]["product_variants"]["Row"];

interface Props {
  id: string;
  initialData: ProductWithVariants;
}

export function ProductDetailView({ id, initialData }: Props) {
  const router = useRouter();
  const { data: product } = useProduct(id, initialData);
  const toggleActive = useUpdateProduct(id);
  const [editOpen, setEditOpen] = useState(false);
  const [addVariantOpen, setAddVariantOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);

  if (!product) return null;

  return (
    <div className="mx-auto max-w-lg p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ChevronLeft />
        </Button>
        <h1 className="flex-1 text-xl font-semibold leading-tight">
          {product.name}
        </h1>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setEditOpen(true)}
        >
          <Pencil />
        </Button>
      </div>

      {/* Product meta */}
      {product.description && (
        <p className="mb-3 text-sm text-muted-foreground">
          {product.description}
        </p>
      )}

      <div className="mb-4 flex items-center gap-2">
        <Badge variant={product.is_active ? "default" : "secondary"}>
          {product.is_active ? "Active" : "Inactive"}
        </Badge>
        <Button
          variant="ghost"
          size="xs"
          disabled={toggleActive.isPending}
          onClick={() => toggleActive.mutate({ is_active: !product.is_active })}
        >
          {product.is_active ? "Deactivate" : "Activate"}
        </Button>
      </div>

      <Separator className="mb-4" />

      {/* Variants section */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Variants
        </h2>
        <Button size="xs" onClick={() => setAddVariantOpen(true)}>
          <Plus />
          Add
        </Button>
      </div>

      {product.product_variants.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No variants yet
        </p>
      ) : (
        <ul className="divide-y">
          {product.product_variants.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className="w-full py-3 text-left transition-colors hover:text-foreground"
                onClick={() => setEditingVariant(v)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{v.name}</p>
                    {v.sku && (
                      <p className="text-xs text-muted-foreground">
                        SKU: {v.sku}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Cost {formatPrice(v.cost_price)} EGP</p>
                    <p>Sell {formatPrice(v.selling_price)} EGP</p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Sheets */}
      <EditProductSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        product={product}
      />

      <AddVariantSheet
        open={addVariantOpen}
        onOpenChange={setAddVariantOpen}
        productId={id}
      />

      {editingVariant && (
        <EditVariantSheet
          open={!!editingVariant}
          onOpenChange={(o) => {
            if (!o) setEditingVariant(null);
          }}
          variant={editingVariant}
          productId={id}
        />
      )}
    </div>
  );
}
