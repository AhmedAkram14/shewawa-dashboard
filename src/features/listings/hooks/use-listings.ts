"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getListings, getListingsByStatus, getListing } from "../api/listings";
import type { ListingStatus } from "../schemas";

export function useListings() {
  return useQuery({
    queryKey: ["listings-list"],
    queryFn: () => getListings(createClient()),
  });
}

export function useListingsByStatus(status: ListingStatus) {
  return useQuery({
    queryKey: ["listings-list", { status }],
    queryFn: () => getListingsByStatus(createClient(), status),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listings-list", id],
    queryFn: () => getListing(createClient(), id),
    enabled: !!id,
  });
}
