"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { orderKeys } from "@/features/orders/hooks/use-orders";

import { callAllocateFromStock } from "../api/available-stock";
import { stockKeys } from "./use-available-stock";

export function useAllocateFromStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      stock_id: string;
      order_line_id: string;
      quantity: number;
    }) => callAllocateFromStock(createClient(), args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
