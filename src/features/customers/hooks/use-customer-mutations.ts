"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { createCustomer, updateCustomer } from "../api/customers";
import type { CreateCustomerInput, UpdateCustomerInput } from "../schemas";

export function useCreateCustomer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      createCustomer(createClient(), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      updateCustomer(createClient(), id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
