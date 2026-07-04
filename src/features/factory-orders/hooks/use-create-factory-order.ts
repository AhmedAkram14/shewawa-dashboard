"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/db-error";

import { callCreateFactoryOrder } from "../api/factory-orders";
import { factoryOrderKeys } from "./use-factory-orders";
import { orderKeys } from "@/features/orders/hooks/use-orders";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

export function useCreateFactoryOrder() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (args: Parameters<typeof callCreateFactoryOrder>[1]) =>
      callCreateFactoryOrder(createClient(), args),
    onMutate: () => ({ toastId: toast.loading("Creating factory order…") }),
    onSuccess: (factoryOrderId, _, ctx) => {
      qc.invalidateQueries({ queryKey: factoryOrderKeys.all });
      qc.invalidateQueries({ queryKey: factoryOrderKeys.pendingLines });
      qc.invalidateQueries({ queryKey: orderKeys.all });
      qc.invalidateQueries({ queryKey: todayKeys.summary });
      toast.success("Factory order created", { id: ctx?.toastId });
      router.push(`/factory-orders/${factoryOrderId}`);
    },
    onError: (err, _, ctx) =>
      toast.error(friendlyError(err), { id: ctx?.toastId }),
  });
}
