"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { callDispatchDelivery } from "../api/deliveries";
import { deliveryKeys } from "./use-deliveries";

export function useDispatchDelivery(deliveryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => callDispatchDelivery(createClient(), deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.detail(deliveryId),
      });
    },
  });
}
