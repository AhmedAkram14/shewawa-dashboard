"use client";

import { useQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";

import { createClient } from "@/lib/supabase/client";
import { searchAll } from "../api/search";
import type { SearchResults } from "../api/search";

const EMPTY: SearchResults = {
  customers: [],
  orders: [],
  factoryOrders: [],
  factories: [],
  products: [],
};

export function useSearch(query: string) {
  // Defer the query so the input stays responsive while results load
  const deferred = useDeferredValue(query.trim());
  const enabled = deferred.length >= 2;

  const result = useQuery({
    queryKey: ["search", deferred],
    queryFn: () => searchAll(createClient(), deferred),
    enabled,
    staleTime: 30_000,
    placeholderData: EMPTY,
  });

  const hasResults =
    enabled &&
    !!result.data &&
    Object.values(result.data).some((arr) => arr.length > 0);

  return {
    results: result.data ?? EMPTY,
    isLoading: result.isFetching,
    hasResults,
    isEmpty: enabled && !result.isFetching && !hasResults,
  };
}
