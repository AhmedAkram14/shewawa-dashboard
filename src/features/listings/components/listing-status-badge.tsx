import { Badge } from "@/components/ui/badge";
import type { ListingStatus } from "../schemas";

const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; className: string }
> = {
  collecting: {
    label: "Collecting",
    className: "bg-c50 text-coral-dk border-transparent",
  },
  decision: {
    label: "Decision Required",
    className: "bg-warn-bg text-warn-tx border-transparent",
  },
  ordered: {
    label: "Ordered",
    className: "bg-muted text-muted-foreground border-transparent",
  },
  receiving: {
    label: "Receiving",
    className: "bg-warn-bg text-warn-tx border-transparent",
  },
  ready_for_packing: {
    label: "Ready for Packing",
    className: "bg-success-bg text-success-tx border-transparent",
  },
  reconciled: {
    label: "Reconciled",
    className: "bg-muted text-muted-foreground border-transparent",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-danger-bg text-danger-tx border-transparent",
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
