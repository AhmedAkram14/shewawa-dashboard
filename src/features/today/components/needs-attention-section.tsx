import Link from "next/link";

import type { NeedsAttentionItem } from "../api/today";
import { TodaySection } from "./today-section";

const LISTING_BADGE_ACCENT: Record<"decision" | "receiving", string> = {
  decision: "bg-warn-bg text-warn-tx",
  receiving: "bg-warn-bg text-warn-tx",
};

const DELIVERY_BADGE_ACCENT: Record<"failed" | "refused", string> = {
  failed: "bg-danger-bg text-danger-tx",
  refused: "bg-danger-bg text-danger-tx",
};

const LISTING_ACTION: Record<"decision" | "receiving", string> = {
  decision: "Needs Factory Decision",
  receiving: "Receiving Pending",
};

const LISTING_BADGE_LABEL: Record<"decision" | "receiving", string> = {
  decision: "Decision",
  receiving: "Receiving",
};

const DELIVERY_ACTION: Record<"failed" | "refused", string> = {
  failed: "Delivery Failed",
  refused: "Delivery Refused",
};

const DELIVERY_BADGE_LABEL: Record<"failed" | "refused", string> = {
  failed: "Failed",
  refused: "Refused",
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
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {LISTING_ACTION[item.stage]}
                  </p>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${LISTING_BADGE_ACCENT[item.stage]}`}
                >
                  {LISTING_BADGE_LABEL[item.stage]}
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
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">
                  {item.customer_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {DELIVERY_ACTION[item.status]}
                </p>
              </div>
              <span
                className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${DELIVERY_BADGE_ACCENT[item.status]}`}
              >
                {DELIVERY_BADGE_LABEL[item.status]}
              </span>
            </Link>
          );
        })}
      </div>
    </TodaySection>
  );
}
