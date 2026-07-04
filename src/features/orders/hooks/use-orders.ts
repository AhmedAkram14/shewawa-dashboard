"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { getOrder, getOrders, getOrdersByCustomer } from "../api/orders";
import type {
  OrderDetail,
  OrderForCustomer,
  OrderWithCustomer,
} from "../api/orders";

export const orderKeys = {
  all: ["orders"] as const,
  detail: (id: string) => ["orders", id] as const,
  byCustomer: (customerId: string) =>
    ["orders", "by-customer", customerId] as const,
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

export function useOrdersByCustomer(customerId: string) {
  return useQuery<OrderForCustomer[]>({
    queryKey: orderKeys.byCustomer(customerId),
    queryFn: () => getOrdersByCustomer(createClient(), customerId),
  });
}
