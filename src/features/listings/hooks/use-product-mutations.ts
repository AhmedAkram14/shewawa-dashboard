"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { createProduct, updateProduct, deleteProduct } from "../api/products";
import type { CreateProductInput, UpdateProductInput } from "../schemas";

export function useCreateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      createProduct(createClient(), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      updateProduct(createClient(), id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["listings", id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(createClient(), id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}
