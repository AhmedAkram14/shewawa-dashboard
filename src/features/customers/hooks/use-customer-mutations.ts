"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { createCustomer, updateCustomer } from "../api/customers";
import type { CustomerInput } from "../schemas";
import { customerKeys } from "./use-customers";

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      createCustomer(createClient(), {
        name: input.name,
        address: input.address,
        phone: input.phone?.trim() || null,
        notes: input.notes?.trim() || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useUpdateCustomer(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      updateCustomer(createClient(), customerId, {
        name: input.name,
        address: input.address,
        phone: input.phone?.trim() || null,
        notes: input.notes?.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      qc.invalidateQueries({ queryKey: customerKeys.detail(customerId) });
    },
  });
}
