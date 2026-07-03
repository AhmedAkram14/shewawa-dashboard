import { Badge } from "@/components/ui/badge";

type DeliveryStatus = "pending" | "dispatched" | "completed";

const STATUS_CONFIG: Record<
  DeliveryStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  dispatched: {
    label: "Dispatched",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200",
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
