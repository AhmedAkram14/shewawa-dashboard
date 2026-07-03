"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { callAddManualStock } from "../api/available-stock";
import { stockKeys } from "./use-available-stock";

export function useAddManualStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      product_variant_id: string;
      quantity: number;
      notes: string | null;
    }) => callAddManualStock(createClient(), args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
    },
  });
}
