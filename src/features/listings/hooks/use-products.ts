"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getProducts, getProduct } from "../api/products";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(createClient()),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => getProduct(createClient(), id),
    enabled: !!id,
  });
}
