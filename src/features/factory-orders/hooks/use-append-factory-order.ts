"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { orderKeys } from "@/features/orders/hooks/use-orders";

import { callAppendFactoryOrder } from "../api/factory-orders";
import { factoryOrderKeys } from "./use-factory-orders";

export function useAppendFactoryOrder(factoryOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderLineIds: string[]) =>
      callAppendFactoryOrder(createClient(), {
        factory_order_id: factoryOrderId,
        order_line_ids: orderLineIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: factoryOrderKeys.detail(factoryOrderId),
      });
      queryClient.invalidateQueries({ queryKey: factoryOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: factoryOrderKeys.pendingLines,
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
