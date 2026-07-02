"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createProductWithVariants,
} from "../api/products";
import type { ProductRow } from "@/lib/supabase/database.types";
import type { CreateProductInput, UpdateProductInput } from "../schemas";
import type { CreateProductWithVariantsInput } from "../api/products";

export function useCreateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      createProduct(createClient(), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      updateProduct(createClient(), id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(createClient(), id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useCreateProductWithVariants() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductWithVariantsInput) =>
      createProductWithVariants(createClient(), input),
    onSuccess: (newProduct) => {
      // Immediately inject into cache so the dropdown reflects the new product
      // without waiting for the background refetch to complete.
      qc.setQueryData<ProductRow[]>(["products"], (existing = []) => [
        newProduct,
        ...existing,
      ]);
      // Background refetch for eventual consistency (server order, timestamps)
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
