"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import { getAvailableStock, type StockEntry } from "../api/available-stock";

export const stockKeys = {
  all: ["available-stock"] as const,
};

export function useAvailableStock(initialData?: StockEntry[]) {
  return useQuery({
    queryKey: stockKeys.all,
    queryFn: () => getAvailableStock(createClient()),
    initialData,
  });
}
