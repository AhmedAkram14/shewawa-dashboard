"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import {
  getAvailableStock,
  addAvailableStock,
  updateAvailableStock,
} from "../api/available-stock";
import type { AddStockInput, UpdateStockInput } from "../schemas";

export function useAvailableStock() {
  return useQuery({
    queryKey: ["available-stock"],
    queryFn: () => getAvailableStock(createClient()),
  });
}

export function useAddAvailableStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddStockInput) =>
      addAvailableStock(createClient(), input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["available-stock"] });
    },
  });
}

export function useUpdateAvailableStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStockInput }) =>
      updateAvailableStock(createClient(), id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["available-stock"] });
    },
  });
}
