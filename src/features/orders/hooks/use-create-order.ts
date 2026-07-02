"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { callCreateOrder } from "../api/orders";
import { orderKeys } from "./use-orders";

export function useCreateOrder() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (args: Parameters<typeof callCreateOrder>[1]) =>
      callCreateOrder(createClient(), args),
    onSuccess: (orderId) => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      router.push(`/orders/${orderId}`);
    },
  });
}
