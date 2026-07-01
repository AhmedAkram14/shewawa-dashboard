"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getFactories } from "../api/factories";

export function useFactories() {
  return useQuery({
    queryKey: ["factories"],
    queryFn: () => getFactories(createClient()),
  });
}
