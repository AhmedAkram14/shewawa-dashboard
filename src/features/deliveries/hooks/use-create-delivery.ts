"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { orderKeys } from "@/features/orders/hooks/use-orders";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

import { callCreateDelivery } from "../api/deliveries";
import { deliveryKeys } from "./use-deliveries";

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (args: { order_ids: string[]; notes: string | null }) =>
      callCreateDelivery(createClient(), args),
    onMutate: () => ({ toastId: toast.loading("Creating delivery…") }),
    onSuccess: (deliveryId, _, ctx) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.readyOrders });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: todayKeys.summary });
      toast.success("Delivery created", { id: ctx?.toastId });
      router.push(`/deliveries/${deliveryId}`);
    },
    onError: (err, _, ctx) => toast.error(err.message, { id: ctx?.toastId }),
  });
}
