import { Badge } from "@/components/ui/badge";

import type { FactoryOrderRow } from "../api/factory-orders";

type FOStatus = FactoryOrderRow["status"];

const LABELS: Record<FOStatus, string> = {
  open: "Open",
  closed: "Closed",
};

const VARIANTS: Record<FOStatus, "default" | "secondary" | "outline"> = {
  open: "default",
  closed: "outline",
};

export function FactoryOrderStatusBadge({ status }: { status: FOStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
