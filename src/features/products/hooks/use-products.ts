"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { getProduct, getProducts } from "../api/products";
import type {
  ProductWithVariantCount,
  ProductWithVariants,
} from "../api/products";

export const productKeys = {
  all: ["products"] as const,
  detail: (id: string) => ["products", id] as const,
};

export function useProducts(initialData?: ProductWithVariantCount[]) {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: () => getProducts(createClient()),
    initialData,
  });
}

export function useProduct(id: string, initialData?: ProductWithVariants) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(createClient(), id),
    initialData,
  });
}
