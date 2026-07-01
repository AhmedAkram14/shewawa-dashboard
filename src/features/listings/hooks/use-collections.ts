"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getCollections, getCollectionWithListings } from "../api/collections";

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => getCollections(createClient()),
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: ["collections", id],
    queryFn: () => getCollectionWithListings(createClient(), id),
    enabled: !!id,
  });
}
