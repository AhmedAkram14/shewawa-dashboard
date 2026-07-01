"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { createOrder, updateOrder, cancelOrder } from "../api/orders";
import type { CreateOrderInput, UpdateOrderInput } from "../schemas";

export function useCreateOrder(listingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(createClient(), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", listingId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrder(listingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrderInput }) =>
      updateOrder(createClient(), id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", listingId] });
    },
  });
}

export function useCancelOrder(listingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelOrder(createClient(), id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", listingId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
