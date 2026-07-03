"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { orderKeys } from "@/features/orders/hooks/use-orders";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

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
    onMutate: () => ({ toastId: toast.loading("Allocating stock…") }),
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: todayKeys.summary });
      toast.success("Stock allocated", { id: ctx?.toastId });
    },
    onError: (err, _, ctx) => toast.error(err.message, { id: ctx?.toastId }),
  });
}
