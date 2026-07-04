"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

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
    onError: (err, _, ctx) => {
      const message = err.message.includes(
        "factory_orders_one_open_per_factory",
      )
        ? "This factory already has an open factory order. Close it first, or add these items to the existing order."
        : err.message;
      toast.error(message, { id: ctx?.toastId });
    },
  });
}
