"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import {
  getFactoryOrders,
  getFactoryOrder,
  getDecisionListingsByFactory,
} from "../api/factory-orders";

export function useFactoryOrders() {
  return useQuery({
    queryKey: ["factory-orders"],
    queryFn: () => getFactoryOrders(createClient()),
  });
}

export function useFactoryOrder(id: string) {
  return useQuery({
    queryKey: ["factory-orders", id],
    queryFn: () => getFactoryOrder(createClient(), id),
    enabled: !!id,
  });
}

export function useDecisionListingsByFactory(
  factoryId: string,
  excludeListingId: string,
) {
  return useQuery({
    queryKey: ["listings-list", "decision-bundle", factoryId, excludeListingId],
    queryFn: () =>
      getDecisionListingsByFactory(createClient(), factoryId, excludeListingId),
    enabled: !!factoryId,
  });
}
