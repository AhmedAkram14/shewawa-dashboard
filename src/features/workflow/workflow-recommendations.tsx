"use client";

import type { TodaySummary } from "@/features/today/api/today";
import { useWorkflowRecommendations } from "./use-workflow-recommendations";
import { RecommendationList } from "./recommendation-list";

interface Props {
  initialSummary?: TodaySummary;
  limit?: number;
  label?: string;
}

export function WorkflowRecommendations({
  initialSummary,
  limit,
  label = "Next Steps",
}: Props) {
  const { recommendations, isLoading } =
    useWorkflowRecommendations(initialSummary);

  if (isLoading) return null;

  const visible = limit ? recommendations.slice(0, limit) : recommendations;

  return (
    <RecommendationList
      recommendations={visible}
      label={label}
      emptyMessage="All caught up — no action required right now"
    />
  );
}
