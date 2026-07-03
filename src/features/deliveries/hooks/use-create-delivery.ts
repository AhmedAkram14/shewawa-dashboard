"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { orderKeys } from "@/features/orders/hooks/use-orders";

import { callCreateDelivery } from "../api/deliveries";
import { deliveryKeys } from "./use-deliveries";

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (args: { order_ids: string[]; notes: string | null }) =>
      callCreateDelivery(createClient(), args),
    onSuccess: (deliveryId) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.readyOrders });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      router.push(`/deliveries/${deliveryId}`);
    },
  });
}
