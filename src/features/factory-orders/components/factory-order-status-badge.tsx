import { Badge } from "@/components/ui/badge";

import type { FactoryOrderRow } from "../api/factory-orders";

type FOStatus = FactoryOrderRow["status"];

const STATUS_CONFIG: Record<FOStatus, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-c50 text-coral-dk border-c100",
  },
  closed: {
    label: "Closed",
    className: "bg-success-bg text-success-tx border-success-tx/20",
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
