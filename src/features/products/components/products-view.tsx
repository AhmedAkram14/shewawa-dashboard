"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

import { AddProductSheet } from "./add-product-sheet";
import { useProducts } from "../hooks/use-products";
import type { ProductWithVariantCount } from "../api/products";

interface Props {
  initialData: ProductWithVariantCount[];
}

export function ProductsView({ initialData }: Props) {
  const router = useRouter();
  const { data: products = [] } = useProducts(initialData);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="flex-1 text-2xl font-semibold leading-tight">
          Products
        </h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus />
          New
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-4 text-sm text-muted-foreground">No products yet</p>
          <Button onClick={() => setAddOpen(true)}>
            Add your first product
          </Button>
        </div>
      ) : (
        <ul className="divide-y">
          {products.map((product) => {
            const variants = product.product_variants;
            const prices = variants.map((v) => v.selling_price);
            const minPrice = prices.length ? Math.min(...prices) : null;
            const maxPrice = prices.length ? Math.max(...prices) : null;
            return (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                  className="block py-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{product.name}</span>
                    {!product.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  {variants.length > 0 ? (
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{variants.map((v) => v.name).join(" · ")}</span>
                      {minPrice != null && (
                        <>
                          <span>—</span>
                          <span>
                            {minPrice === maxPrice
                              ? `EGP ${formatPrice(minPrice)}`
                              : `EGP ${formatPrice(minPrice)} – ${formatPrice(maxPrice!)}`}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      No variants yet
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <AddProductSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
