"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { getOrder, getOrders } from "../api/orders";
import type { OrderDetail, OrderWithCustomer } from "../api/orders";

export const orderKeys = {
  all: ["orders"] as const,
  detail: (id: string) => ["orders", id] as const,
};

export function useOrders(initialData?: OrderWithCustomer[]) {
  return useQuery({
    queryKey: orderKeys.all,
    queryFn: () => getOrders(createClient()),
    initialData,
  });
}

export function useOrder(id: string, initialData?: OrderDetail) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrder(createClient(), id),
    initialData,
  });
}
