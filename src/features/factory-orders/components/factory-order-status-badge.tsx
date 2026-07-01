import { Badge } from "@/components/ui/badge";
import type { FactoryOrderStatus } from "../schemas";

const STATUS_STYLES: Record<FactoryOrderStatus, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  placed: "bg-blue-100 text-blue-800 border-blue-200",
};

const STATUS_LABELS: Record<FactoryOrderStatus, string> = {
  draft: "Draft",
  placed: "Placed",
};

export function FactoryOrderStatusBadge({
  status,
}: {
  status: FactoryOrderStatus;
}) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] ?? ""}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
