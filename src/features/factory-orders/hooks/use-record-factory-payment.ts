"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/db-error";
import { callRecordFactoryPayment } from "../api/factory-orders";
import { factoryOrderKeys } from "./use-factory-orders";

export function useRecordFactoryPayment(factoryOrderId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      amount: number;
      paid_at: string;
      reference: string | null;
      notes: string | null;
    }) =>
      callRecordFactoryPayment(createClient(), {
        factory_order_id: factoryOrderId,
        ...args,
      }),
    onMutate: () => ({ toastId: toast.loading("Recording payment…") }),
    onSuccess: (_, __, ctx) => {
      qc.invalidateQueries({
        queryKey: factoryOrderKeys.detail(factoryOrderId),
      });
      toast.success("Payment recorded", { id: ctx?.toastId });
    },
    onError: (err, _, ctx) =>
      toast.error(friendlyError(err), { id: ctx?.toastId }),
  });
}
