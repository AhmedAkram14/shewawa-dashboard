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
        <ul className="space-y-2">
          {products.map((product) => {
            const variants = product.product_variants;
            const prices = variants.map((v) => v.selling_price);
            const minPrice = prices.length ? Math.min(...prices) : null;
            const maxPrice = prices.length ? Math.max(...prices) : null;
            const priceStr =
              minPrice != null
                ? minPrice === maxPrice
                  ? `EGP ${formatPrice(minPrice)}`
                  : `EGP ${formatPrice(minPrice)} – ${formatPrice(maxPrice!)}`
                : null;
            return (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                  className="block rounded-xl border bg-card transition-all hover:border-primary/20 hover:shadow-sm active:bg-accent"
                >
                  <div className="flex gap-3 p-4">
                    {/* Thumbnail */}
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{product.name}</span>
                        {!product.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
                        {variants.length > 0 ? (
                          <span className="truncate">
                            {variants.map((v) => v.name).join(" · ")}
                          </span>
                        ) : (
                          <span className="italic">No variants yet</span>
                        )}
                        {priceStr && (
                          <span className="shrink-0 font-medium text-foreground">
                            {priceStr}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
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
