"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { createVariant, updateVariant, deleteVariant } from "../api/variants";
import type { CreateVariantInput, UpdateVariantInput } from "../schemas";

export function useCreateVariant(productId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVariantInput) =>
      createVariant(createClient(), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings", productId, "variants"] });
    },
  });
}

export function useUpdateVariant(productId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVariantInput }) =>
      updateVariant(createClient(), id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings", productId, "variants"] });
    },
  });
}

export function useDeleteVariant(productId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVariant(createClient(), id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings", productId, "variants"] });
    },
  });
}
