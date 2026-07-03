"use client";

import { useTodaySummary } from "@/features/today/hooks/use-today-summary";
import type { TodaySummary } from "@/features/today/api/today";
import { deriveRecommendations } from "./derive-recommendations";

export function useWorkflowRecommendations(initialData?: TodaySummary) {
  const { data: summary, isLoading } = useTodaySummary(initialData);
  const recommendations = summary ? deriveRecommendations(summary) : [];
  return { recommendations, isLoading };
}
