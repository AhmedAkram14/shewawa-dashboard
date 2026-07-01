"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getOrdersByListing, getAllOrders } from "../api/orders";

export function useOrdersByListing(listingId: string) {
  return useQuery({
    queryKey: ["orders", listingId],
    queryFn: () => getOrdersByListing(createClient(), listingId),
    enabled: !!listingId,
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => getAllOrders(createClient()),
  });
}
