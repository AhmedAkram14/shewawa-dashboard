"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { createFactory, updateFactory } from "../api/factories";
import type { FactoryInput } from "../schemas";
import { factoryKeys } from "./use-factories";

export function useCreateFactory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FactoryInput) =>
      createFactory(createClient(), {
        name: input.name,
        contact: input.contact?.trim() || null,
        notes: input.notes?.trim() || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: factoryKeys.all }),
  });
}

export function useUpdateFactory(factoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FactoryInput) =>
      updateFactory(createClient(), factoryId, {
        name: input.name,
        contact: input.contact?.trim() || null,
        notes: input.notes?.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: factoryKeys.all });
      qc.invalidateQueries({ queryKey: factoryKeys.detail(factoryId) });
    },
  });
}
