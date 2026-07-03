"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { orderKeys } from "@/features/orders/hooks/use-orders";

import { callCompleteDelivery } from "../api/deliveries";
import { deliveryKeys } from "./use-deliveries";

export function useCompleteDelivery(deliveryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => callCompleteDelivery(createClient(), deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.detail(deliveryId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
