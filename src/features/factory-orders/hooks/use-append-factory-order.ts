"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/db-error";
import { orderKeys } from "@/features/orders/hooks/use-orders";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

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
    onMutate: () => ({ toastId: toast.loading("Adding orders…") }),
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({
        queryKey: factoryOrderKeys.detail(factoryOrderId),
      });
      queryClient.invalidateQueries({ queryKey: factoryOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: factoryOrderKeys.pendingLines,
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: todayKeys.summary });
      toast.success("Orders added to factory order", { id: ctx?.toastId });
    },
    onError: (err, _, ctx) =>
      toast.error(friendlyError(err), { id: ctx?.toastId }),
  });
}
