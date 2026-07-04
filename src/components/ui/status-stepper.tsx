import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepDef {
  key: string;
  label: string;
}

interface Props {
  steps: StepDef[];
  currentKey: string;
  /** Key(s) that represent a terminal failure state (all steps go dim). */
  cancelledKey?: string | string[];
  /** Label shown below the stepper when in a cancelled/terminal state. Defaults to "Cancelled". */
  cancelledLabel?: string;
}

export function StatusStepper({
  steps,
  currentKey,
  cancelledKey,
  cancelledLabel = "Cancelled",
}: Props) {
  const cancelledKeys = cancelledKey
    ? Array.isArray(cancelledKey)
      ? cancelledKey
      : [cancelledKey]
    : [];
  const isCancelled = cancelledKeys.includes(currentKey);
  const currentIndex = isCancelled
    ? -1
    : steps.findIndex((s) => s.key === currentKey);

  const n = steps.length;
  const lineStartPct = 100 / (2 * n);
  const lineWidthPct = 100 - 100 / n;
  const progressPct =
    isCancelled || currentIndex <= 0
      ? 0
      : (currentIndex / (n - 1)) * lineWidthPct;

  return (
    <div className="space-y-3">
      <div className="relative flex items-start">
        {/* Grey track */}
        <div
          className="absolute top-3.5 h-0.5 rounded-full bg-border"
          style={{ left: `${lineStartPct}%`, width: `${lineWidthPct}%` }}
        />
        {/* Coral filled track */}
        <div
          className="absolute top-3.5 h-0.5 rounded-full bg-coral transition-all duration-500"
          style={{ left: `${lineStartPct}%`, width: `${progressPct}%` }}
        />

        {steps.map((step, i) => {
          const isCompleted = !isCancelled && i < currentIndex;
          const isCurrent = !isCancelled && i === currentIndex;
          const isUpcoming = isCancelled || i > currentIndex;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-1 flex-col items-center gap-2"
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-300",
                  isCompleted && "bg-coral shadow-sm",
                  isCurrent && "bg-coral shadow-lg",
                  isUpcoming && "bg-muted",
                )}
              >
                {isCompleted && (
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                )}
                {isCurrent && (
                  <div className="h-2.5 w-2.5 rounded-sm bg-white/90" />
                )}
                {isUpcoming && (
                  <div className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/25" />
                )}
              </div>

              <p
                className={cn(
                  "text-center text-xs leading-tight",
                  isCompleted && "font-semibold text-coral-dk",
                  isCurrent && "font-bold text-coral-dk",
                  isUpcoming && "font-medium text-muted-foreground",
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
          {cancelledLabel}
        </p>
      )}
    </div>
  );
}
