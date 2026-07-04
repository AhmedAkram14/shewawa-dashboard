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

  return (
    <div className="space-y-2">
      <div className="flex items-start">
        {steps.map((step, i) => {
          const isCompleted = !isCancelled && i < currentIndex;
          const isCurrent = !isCancelled && i === currentIndex;
          const isLast = i === steps.length - 1;
          const connectorActive = !isCancelled && i + 1 <= currentIndex;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              {/* Row: left line + circle + right line */}
              <div className="flex w-full items-center">
                {/* Left connector */}
                {i > 0 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      !isCancelled && i <= currentIndex
                        ? "bg-coral"
                        : "bg-border",
                    )}
                  />
                )}

                {/* Circle */}
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted && "border-coral bg-coral",
                    isCurrent && "border-coral bg-background",
                    !isCompleted && !isCurrent && "border-border bg-background",
                  )}
                >
                  {isCompleted && (
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  )}
                  {isCurrent && (
                    <div className="h-2 w-2 rounded-full bg-coral" />
                  )}
                </div>

                {/* Right connector */}
                {!isLast && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      connectorActive ? "bg-coral" : "bg-border",
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <p
                className={cn(
                  "mt-1.5 text-center text-[10px] leading-tight",
                  isCompleted && "font-medium text-coral-dk",
                  isCurrent && "font-semibold text-coral-dk",
                  !isCompleted && !isCurrent && "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <p className="text-center text-xs font-medium text-destructive">
          Cancelled
        </p>
      )}
    </div>
  );
}
