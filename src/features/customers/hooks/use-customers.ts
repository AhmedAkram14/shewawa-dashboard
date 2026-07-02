"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { getCustomer, getCustomers } from "../api/customers";
import type { CustomerRow } from "../api/customers";

export const customerKeys = {
  all: ["customers"] as const,
  detail: (id: string) => ["customers", id] as const,
};

export function useCustomers(initialData?: CustomerRow[]) {
  return useQuery({
    queryKey: customerKeys.all,
    queryFn: () => getCustomers(createClient()),
    initialData,
  });
}

export function useCustomer(id: string, initialData?: CustomerRow) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomer(createClient(), id),
    initialData,
  });
}
