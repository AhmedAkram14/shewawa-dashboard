import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepDef {
  key: string;
  label: string;
}

interface Props {
  steps: StepDef[];
  currentKey: string;
  cancelledKey?: string;
}

export function StatusStepper({ steps, currentKey, cancelledKey }: Props) {
  const isCancelled = !!cancelledKey && currentKey === cancelledKey;
  const currentIndex = isCancelled
    ? -1
    : steps.findIndex((s) => s.key === currentKey);

  const n = steps.length;
  // Line runs between the centers of the first and last circles.
  // Each step takes 1/n of the width; circle center is at the midpoint of that slot.
  const lineStartPct = 100 / (2 * n); // % from left edge to first circle center
  const lineWidthPct = 100 - 100 / n; // % width of the full line
  const progressPct =
    isCancelled || currentIndex <= 0
      ? 0
      : (currentIndex / (n - 1)) * lineWidthPct;

  return (
    <div className="space-y-3">
      {/* Track + circles */}
      <div className="relative flex items-start">
        {/* Full grey track */}
        <div
          className="absolute top-4 h-0.5 bg-border"
          style={{ left: `${lineStartPct}%`, width: `${lineWidthPct}%` }}
        />
        {/* Filled coral track */}
        <div
          className="absolute top-4 h-0.5 bg-coral transition-all duration-500"
          style={{ left: `${lineStartPct}%`, width: `${progressPct}%` }}
        />

        {steps.map((step, i) => {
          const isCompleted = !isCancelled && i < currentIndex;
          const isCurrent = !isCancelled && i === currentIndex;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-1 flex-col items-center gap-2"
            >
              {/* Circle */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                  isCompleted && "bg-coral shadow-sm",
                  isCurrent &&
                    "bg-coral shadow-[0_0_0_4px_hsl(var(--c50))] ring-1 ring-coral/30",
                  !isCompleted &&
                    !isCurrent &&
                    "border-2 border-border bg-background",
                )}
              >
                {isCompleted && (
                  <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                )}
                {isCurrent && <div className="h-3 w-3 rounded-full bg-white" />}
              </div>

              {/* Label */}
              <p
                className={cn(
                  "text-center text-[11px] font-medium leading-tight",
                  isCompleted || isCurrent
                    ? "text-coral-dk"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <p className="text-center text-xs font-semibold text-destructive">
          Cancelled
        </p>
      )}
    </div>
  );
}
