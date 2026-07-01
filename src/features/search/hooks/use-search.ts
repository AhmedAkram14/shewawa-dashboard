"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { searchAll } from "../api/search";

export function useSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  return useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchAll(createClient(), debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 10_000,
  });
}
