import { Badge } from "@/components/ui/badge";
import type { DeliveryStatus } from "../schemas";

const STATUS_STYLES: Record<DeliveryStatus, string> = {
  pending: "bg-muted text-muted-foreground border-transparent",
  out_for_delivery: "bg-warn-bg text-warn-tx border-transparent",
  delivered: "bg-success-bg text-success-tx border-transparent",
  refused: "bg-danger-bg text-danger-tx border-transparent",
  failed: "bg-danger-bg text-danger-tx border-transparent",
};

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: "Pending",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  refused: "Refused",
  failed: "Failed",
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] ?? ""}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
