import { Badge } from "@/components/ui/badge";

import type { FactoryOrderRow } from "../api/factory-orders";

type FOStatus = FactoryOrderRow["status"];

const STATUS_CONFIG: Record<FOStatus, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  closed: {
    label: "Closed",
    className: "bg-green-50 text-green-700 border-green-200",
  },
};

export function FactoryOrderStatusBadge({ status }: { status: FOStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
