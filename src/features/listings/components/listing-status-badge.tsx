import { Badge } from "@/components/ui/badge";
import type { ListingStatus } from "../schemas";

const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; className: string }
> = {
  collecting: {
    label: "Collecting",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  decision: {
    label: "Decision Required",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  ordered: {
    label: "Ordered",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  receiving: {
    label: "Receiving",
    className:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  ready_for_packing: {
    label: "Ready for Packing",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  reconciled: {
    label: "Reconciled",
    className: "bg-muted text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
