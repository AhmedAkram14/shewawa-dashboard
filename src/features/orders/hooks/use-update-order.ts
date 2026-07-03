"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { callUpdateOrder } from "../api/orders";
import { orderKeys } from "./use-orders";

export function useUpdateOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { deposit_amount: number; notes: string | null }) =>
      callUpdateOrder(createClient(), { order_id: orderId, ...args }),
    onMutate: () => ({ toastId: toast.loading("Saving changes…") }),
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      toast.success("Order updated", { id: ctx?.toastId });
    },
    onError: (err, _, ctx) => toast.error(err.message, { id: ctx?.toastId }),
  });
}
