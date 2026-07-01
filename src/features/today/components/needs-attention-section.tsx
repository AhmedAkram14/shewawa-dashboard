import Link from "next/link";

import type { NeedsAttentionItem } from "../api/today";
import { TodaySection } from "./today-section";

const STAGE_LABELS: Record<"decision" | "receiving", string> = {
  decision: "Decision",
  receiving: "Receiving",
};

const STATUS_LABELS: Record<"failed" | "refused", string> = {
  failed: "Failed",
  refused: "Refused",
};

const ACCENT: Record<string, string> = {
  decision: "bg-yellow-100 text-yellow-800",
  receiving: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
  refused: "bg-orange-100 text-orange-800",
};

export function NeedsAttentionSection({
  items,
}: {
  items: NeedsAttentionItem[];
}) {
  return (
    <TodaySection
      title="Needs Attention"
      count={items.length}
      emptyText="No immediate action needed."
    >
      <div className="space-y-1 px-4">
        {items.map((item) => {
          if (item.kind === "listing") {
            return (
              <Link
                key={`listing-${item.id}`}
                href={`/listings/${item.id}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-accent active:bg-accent/80"
              >
                <span className="text-sm font-medium">{item.product_name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACCENT[item.stage]}`}
                >
                  {STAGE_LABELS[item.stage]}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={`delivery-${item.id}`}
              href={`/deliveries/${item.id}`}
              className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-accent active:bg-accent/80"
            >
              <span className="text-sm font-medium">{item.customer_name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACCENT[item.status]}`}
              >
                {STATUS_LABELS[item.status]}
              </span>
            </Link>
          );
        })}
      </div>
    </TodaySection>
  );
}
