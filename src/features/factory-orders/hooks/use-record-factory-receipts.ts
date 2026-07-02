"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { orderKeys } from "@/features/orders/hooks/use-orders";

import { callRecordFactoryReceipts } from "../api/factory-orders";
import { factoryOrderKeys } from "./use-factory-orders";

export function useRecordFactoryReceipts(factoryOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      received_at: string;
      notes: string | null;
      receipts: {
        factory_order_line_id: string;
        quantity: number;
        allocations: { order_line_id: string; quantity: number }[];
      }[];
    }) =>
      callRecordFactoryReceipts(createClient(), {
        factory_order_id: factoryOrderId,
        ...args,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factoryOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: factoryOrderKeys.detail(factoryOrderId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
