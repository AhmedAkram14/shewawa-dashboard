"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getCollections } from "../api/collections";

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => getCollections(createClient()),
  });
}
