"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { getFactory, getFactories } from "../api/factories";
import type { FactoryRow, FactoryWithStats } from "../api/factories";

export const factoryKeys = {
  all: ["factories"] as const,
  detail: (id: string) => ["factories", id] as const,
};

export function useFactories(initialData?: FactoryWithStats[]) {
  return useQuery({
    queryKey: factoryKeys.all,
    queryFn: () => getFactories(createClient()),
    initialData,
  });
}

export function useFactory(id: string, initialData?: FactoryRow) {
  return useQuery({
    queryKey: factoryKeys.detail(id),
    queryFn: () => getFactory(createClient(), id),
    initialData,
  });
}
