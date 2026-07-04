"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/db-error";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

import { callCancelOrder } from "../api/orders";
import { orderKeys } from "./use-orders";

export function useCancelOrder(orderId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => callCancelOrder(createClient(), orderId),
    onMutate: () => ({ toastId: toast.loading("Cancelling order…") }),
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: todayKeys.summary });
      toast.success("Order cancelled", { id: ctx?.toastId });
      router.push("/orders");
    },
    onError: (err, _, ctx) =>
      toast.error(friendlyError(err), { id: ctx?.toastId }),
  });
}
