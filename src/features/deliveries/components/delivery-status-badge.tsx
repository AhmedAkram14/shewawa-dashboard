import { Badge } from "@/components/ui/badge";
import type { DeliveryStatus } from "../schemas";

const STATUS_STYLES: Record<DeliveryStatus, string> = {
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  out_for_delivery: "bg-blue-100 text-blue-800 border-blue-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  refused: "bg-orange-100 text-orange-800 border-orange-200",
  failed: "bg-red-100 text-red-800 border-red-200",
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
