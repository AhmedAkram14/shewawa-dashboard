"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { callSetFactoryLineCost } from "../api/factory-orders";
import { factoryOrderKeys } from "./use-factory-orders";

export function useSetFactoryLineCost(factoryOrderId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (args: { line_id: string; unit_cost: number | null }) =>
      callSetFactoryLineCost(createClient(), args),
    onMutate: () => ({ toastId: toast.loading("Saving cost…") }),
    onSuccess: (_, __, ctx) => {
      qc.invalidateQueries({
        queryKey: factoryOrderKeys.detail(factoryOrderId),
      });
      toast.success("Cost updated", { id: ctx?.toastId });
    },
    onError: (err, _, ctx) => toast.error(err.message, { id: ctx?.toastId }),
  });
}
