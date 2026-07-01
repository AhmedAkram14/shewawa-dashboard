"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { createCollection, updateCollection } from "../api/collections";
import type { CreateCollectionInput, UpdateCollectionInput } from "../schemas";

export function useCreateCollection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCollectionInput) =>
      createCollection(createClient(), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useUpdateCollection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCollectionInput }) =>
      updateCollection(createClient(), id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
