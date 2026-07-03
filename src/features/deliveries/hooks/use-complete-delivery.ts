"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { orderKeys } from "@/features/orders/hooks/use-orders";

import {
  callCompleteDelivery,
  type FailedOrderOutcome,
} from "../api/deliveries";
import { deliveryKeys } from "./use-deliveries";

export function useCompleteDelivery(deliveryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      args: { failedOrders: FailedOrderOutcome[] } = { failedOrders: [] },
    ) => callCompleteDelivery(createClient(), deliveryId, args.failedOrders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.detail(deliveryId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
