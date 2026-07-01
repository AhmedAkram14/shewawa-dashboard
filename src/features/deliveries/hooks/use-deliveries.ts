"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import {
  getDeliveries,
  getDelivery,
  getPackingCustomers,
} from "../api/deliveries";

export function useDeliveries() {
  return useQuery({
    queryKey: ["deliveries"],
    queryFn: () => getDeliveries(createClient()),
  });
}

export function useDelivery(id: string) {
  return useQuery({
    queryKey: ["deliveries", id],
    queryFn: () => getDelivery(createClient(), id),
    enabled: !!id,
  });
}

export function usePackingCustomers() {
  return useQuery({
    queryKey: ["orders", "packing-customers"],
    queryFn: () => getPackingCustomers(createClient()),
  });
}
