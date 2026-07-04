"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/db-error";
import { orderKeys } from "@/features/orders/hooks/use-orders";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

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
    onMutate: () => ({ toastId: toast.loading("Completing delivery…") }),
    onSuccess: (_, args, ctx) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.detail(deliveryId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: todayKeys.summary });
      const returned = args.failedOrders.length;
      if (returned > 0) {
        toast.success(
          `Delivery completed — ${returned} order${returned !== 1 ? "s" : ""} returned to ready queue`,
          { id: ctx?.toastId },
        );
      } else {
        toast.success("Delivery completed successfully", { id: ctx?.toastId });
      }
    },
    onError: (err, _, ctx) =>
      toast.error(friendlyError(err), { id: ctx?.toastId }),
  });
}
