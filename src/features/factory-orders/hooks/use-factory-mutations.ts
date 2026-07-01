"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { createFactory, updateFactory } from "../api/factories";
import type { CreateFactoryInput, UpdateFactoryInput } from "../schemas";

export function useCreateFactory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFactoryInput) =>
      createFactory(createClient(), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["factories"] });
    },
  });
}

export function useUpdateFactory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFactoryInput }) =>
      updateFactory(createClient(), id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["factories"] });
    },
  });
}
