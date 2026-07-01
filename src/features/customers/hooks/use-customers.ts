"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getCustomers, getCustomerWithOrders } from "../api/customers";

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers(createClient()),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => getCustomerWithOrders(createClient(), id),
    enabled: !!id,
  });
}
