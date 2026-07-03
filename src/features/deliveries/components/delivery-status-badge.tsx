import { Badge } from "@/components/ui/badge";

type DeliveryStatus = "pending" | "dispatched" | "completed";

const STATUS_CONFIG: Record<
  DeliveryStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-warn-bg text-warn-tx border-warn-tx/30",
  },
  dispatched: {
    label: "Dispatched",
    className: "bg-c100 text-coral-dk border-c200",
  },
  completed: {
    label: "Completed",
    className: "bg-success-bg text-success-tx border-success-tx/20",
  },
};

export function DeliveryStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as DeliveryStatus] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
