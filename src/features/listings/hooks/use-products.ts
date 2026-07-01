"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getProducts, getProduct } from "../api/products";

export function useProducts() {
  return useQuery({
    queryKey: ["listings"],
    queryFn: () => getProducts(createClient()),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["listings", id],
    queryFn: () => getProduct(createClient(), id),
    enabled: !!id,
  });
}
