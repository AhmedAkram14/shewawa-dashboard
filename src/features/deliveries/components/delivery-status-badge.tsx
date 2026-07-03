import { Badge } from "@/components/ui/badge";

type DeliveryStatus = "pending" | "dispatched" | "completed";

const STATUS_CONFIG: Record<
  DeliveryStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  dispatched: {
    label: "Dispatched",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  completed: {
    label: "Completed",
    className: "bg-green-50 text-green-700 border-green-200",
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
