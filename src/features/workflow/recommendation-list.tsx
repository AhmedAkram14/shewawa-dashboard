"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import type { Recommendation } from "./derive-recommendations";

interface Props {
  recommendations: Recommendation[];
  label?: string;
  emptyMessage?: string;
}

export function RecommendationList({
  recommendations,
  label = "What's Next",
  emptyMessage,
}: Props) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h2>

      {recommendations.length === 0 ? (
        emptyMessage ? (
          <div className="flex items-center gap-3 rounded-xl border bg-success-bg p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success-tx" />
            <p className="text-sm font-medium text-success-tx">
              {emptyMessage}
            </p>
          </div>
        ) : null
      ) : (
        <ul className="space-y-2">
          {recommendations.map((rec, i) => {
            const Icon = rec.icon;
            return (
              <li key={rec.id}>
                <Link href={rec.href} className="block">
                  <div
                    className={`flex items-center gap-3 rounded-xl border p-4 transition-colors active:scale-[0.98] ${
                      i === 0
                        ? "border-primary/30 bg-primary/5"
                        : "bg-card hover:bg-muted/40"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${rec.iconClass}`} />
                    <p className="min-w-0 flex-1 text-sm font-medium">
                      {rec.message}
                    </p>
                    <span className="shrink-0 text-xs font-semibold text-primary">
                      {rec.actionLabel} →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
