"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { callCreateFactoryOrder } from "../api/factory-orders";
import { factoryOrderKeys } from "./use-factory-orders";
import { orderKeys } from "@/features/orders/hooks/use-orders";

export function useCreateFactoryOrder() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (args: Parameters<typeof callCreateFactoryOrder>[1]) =>
      callCreateFactoryOrder(createClient(), args),
    onSuccess: (factoryOrderId) => {
      qc.invalidateQueries({ queryKey: factoryOrderKeys.all });
      qc.invalidateQueries({ queryKey: factoryOrderKeys.pendingLines });
      qc.invalidateQueries({ queryKey: orderKeys.all });
      router.push(`/factory-orders/${factoryOrderId}`);
    },
  });
}
