"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBusinessId } from "@/hooks/use-business-id";

import { AddProductSheet } from "./add-product-sheet";
import { useProducts } from "../hooks/use-products";
import type { ProductWithVariantCount } from "../api/products";

interface Props {
  initialData: ProductWithVariantCount[];
}

export function ProductsView({ initialData }: Props) {
  const { data: products = [] } = useProducts(initialData);
  const { data: businessId } = useBusinessId();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-tight">Products</h1>
        {businessId && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus />
            New
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-4 text-sm text-muted-foreground">No products yet</p>
          {businessId && (
            <Button onClick={() => setAddOpen(true)}>
              Add your first product
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/products/${product.id}`}
                className="flex items-center justify-between py-3 transition-colors hover:text-foreground"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{product.name}</span>
                  {!product.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.product_variants.length}{" "}
                  {product.product_variants.length === 1
                    ? "variant"
                    : "variants"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {businessId && (
        <AddProductSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          businessId={businessId}
        />
      )}
    </div>
  );
}
