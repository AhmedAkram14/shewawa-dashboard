"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { createFactoryOrder, placeFactoryOrder } from "../api/factory-orders";
import type { CreateFactoryOrderInput } from "../schemas";

export function useCreateFactoryOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFactoryOrderInput) =>
      createFactoryOrder(createClient(), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["factory-orders"] });
      qc.invalidateQueries({ queryKey: ["listings-list"] });
    },
  });
}

export function usePlaceFactoryOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => placeFactoryOrder(createClient(), id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["factory-orders"] });
      qc.invalidateQueries({ queryKey: ["factory-orders", id] });
    },
  });
}
