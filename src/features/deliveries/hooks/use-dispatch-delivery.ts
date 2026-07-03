"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

import { callDispatchDelivery } from "../api/deliveries";
import { deliveryKeys } from "./use-deliveries";

export function useDispatchDelivery(deliveryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => callDispatchDelivery(createClient(), deliveryId),
    onMutate: () => ({ toastId: toast.loading("Dispatching delivery…") }),
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.detail(deliveryId),
      });
      queryClient.invalidateQueries({ queryKey: todayKeys.summary });
      toast.success("Delivery marked as dispatched", { id: ctx?.toastId });
    },
    onError: (err, _, ctx) => toast.error(err.message, { id: ctx?.toastId }),
  });
}
