"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

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
    onMutate: () => ({ toastId: toast.loading("Adding stock…") }),
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
      queryClient.invalidateQueries({ queryKey: todayKeys.summary });
      toast.success("Stock entry added", { id: ctx?.toastId });
    },
    onError: (err, _, ctx) => toast.error(err.message, { id: ctx?.toastId }),
  });
}
