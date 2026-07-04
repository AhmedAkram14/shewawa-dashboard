"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/db-error";
import { orderKeys } from "@/features/orders/hooks/use-orders";

import { callRecordFactoryReceipts } from "../api/factory-orders";
import { factoryOrderKeys } from "./use-factory-orders";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

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
    onMutate: () => ({ toastId: toast.loading("Recording receipts…") }),
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: factoryOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: factoryOrderKeys.detail(factoryOrderId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: todayKeys.summary });
      toast.success("Factory receipts recorded", { id: ctx?.toastId });
    },
    onError: (err, _, ctx) =>
      toast.error(friendlyError(err), { id: ctx?.toastId }),
  });
}
