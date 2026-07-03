"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import {
  getDeliveries,
  getDelivery,
  getReadyOrders,
  type DeliveryDetail,
  type DeliveryWithOrderCount,
  type ReadyOrder,
} from "../api/deliveries";

export const deliveryKeys = {
  all: ["deliveries"] as const,
  detail: (id: string) => ["deliveries", id] as const,
  readyOrders: ["deliveries", "ready-orders"] as const,
};

export function useDeliveries(initialData?: DeliveryWithOrderCount[]) {
  return useQuery({
    queryKey: deliveryKeys.all,
    queryFn: () => getDeliveries(createClient()),
    initialData,
  });
}

export function useDelivery(id: string, initialData?: DeliveryDetail) {
  return useQuery({
    queryKey: deliveryKeys.detail(id),
    queryFn: () => getDelivery(createClient(), id),
    initialData,
  });
}

export function useReadyOrders(initialData?: ReadyOrder[]) {
  return useQuery({
    queryKey: deliveryKeys.readyOrders,
    queryFn: () => getReadyOrders(createClient()),
    initialData,
  });
}
