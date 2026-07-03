"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getTodaySummary, type TodaySummary } from "../api/today";

export const todayKeys = {
  summary: ["today-summary"] as const,
};

export function useTodaySummary(initialData?: TodaySummary) {
  return useQuery({
    queryKey: todayKeys.summary,
    queryFn: () => getTodaySummary(createClient()),
    initialData,
    staleTime: 30_000,
  });
}
