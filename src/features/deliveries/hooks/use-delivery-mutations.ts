"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { createDelivery, updateDeliveryStatus } from "../api/deliveries";
import type { CreateDeliveryInput, DeliveryStatus } from "../schemas";

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeliveryInput) =>
      createDelivery(createClient(), input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["deliveries"] });
      void qc.invalidateQueries({ queryKey: ["orders", "packing-customers"] });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DeliveryStatus }) =>
      updateDeliveryStatus(createClient(), id, status),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ["deliveries"] });
      void qc.invalidateQueries({ queryKey: ["deliveries", id] });
    },
  });
}
