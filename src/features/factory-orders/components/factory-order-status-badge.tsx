import { Badge } from "@/components/ui/badge";
import type { FactoryOrderStatus } from "../schemas";

const STATUS_STYLES: Record<FactoryOrderStatus, string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  placed: "bg-c50 text-coral-dk border-transparent",
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
