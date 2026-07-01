"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getTodaySnapshot } from "../api/today";

export function useTodaySnapshot() {
  return useQuery({
    queryKey: ["today"],
    queryFn: () => getTodaySnapshot(createClient()),
    refetchInterval: 60_000,
  });
}
