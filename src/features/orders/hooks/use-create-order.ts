"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

import { callCreateOrder } from "../api/orders";
import { orderKeys } from "./use-orders";

export function useCreateOrder() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (args: Parameters<typeof callCreateOrder>[1]) =>
      callCreateOrder(createClient(), args),
    onMutate: () => ({ toastId: toast.loading("Placing order…") }),
    onSuccess: (orderId, _, ctx) => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      qc.invalidateQueries({ queryKey: todayKeys.summary });
      toast.success("Order created", { id: ctx?.toastId });
      router.push(`/orders/${orderId}`);
    },
    onError: (err, _, ctx) => toast.error(err.message, { id: ctx?.toastId }),
  });
}
