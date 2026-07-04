"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import {
  getFactoryOrder,
  getFactoryOrders,
  getFactoryOrdersByFactory,
  getPendingOrderLines,
} from "../api/factory-orders";
import type {
  FactoryOrderDetail,
  FactoryOrderForFactory,
  FactoryOrderWithFactory,
  PendingOrderLine,
} from "../api/factory-orders";

export const factoryOrderKeys = {
  all: ["factory-orders"] as const,
  detail: (id: string) => ["factory-orders", id] as const,
  pendingLines: ["factory-orders", "pending-lines"] as const,
  byFactory: (factoryId: string) =>
    ["factory-orders", "by-factory", factoryId] as const,
};

export function useFactoryOrders(initialData?: FactoryOrderWithFactory[]) {
  return useQuery({
    queryKey: factoryOrderKeys.all,
    queryFn: () => getFactoryOrders(createClient()),
    initialData,
  });
}

export function useFactoryOrder(id: string, initialData?: FactoryOrderDetail) {
  return useQuery({
    queryKey: factoryOrderKeys.detail(id),
    queryFn: () => getFactoryOrder(createClient(), id),
    initialData,
  });
}

export function useFactoryOrdersByFactory(factoryId: string) {
  return useQuery<FactoryOrderForFactory[]>({
    queryKey: factoryOrderKeys.byFactory(factoryId),
    queryFn: () => getFactoryOrdersByFactory(createClient(), factoryId),
  });
}

export function usePendingOrderLines(initialData?: PendingOrderLine[]) {
  return useQuery({
    queryKey: factoryOrderKeys.pendingLines,
    queryFn: () => getPendingOrderLines(createClient()),
    initialData,
  });
}
