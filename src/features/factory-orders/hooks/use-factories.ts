"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getFactories, getFactoryWithRelations } from "../api/factories";

export function useFactories() {
  return useQuery({
    queryKey: ["factories"],
    queryFn: () => getFactories(createClient()),
  });
}

export function useFactory(id: string) {
  return useQuery({
    queryKey: ["factories", id],
    queryFn: () => getFactoryWithRelations(createClient(), id),
    enabled: !!id,
  });
}
