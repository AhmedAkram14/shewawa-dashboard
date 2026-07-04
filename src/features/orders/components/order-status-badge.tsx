import { Badge } from "@/components/ui/badge";

import type { OrderRow, OrderLineRow } from "../api/orders";

type OrderStatus = OrderRow["status"];
type LineStatus = OrderLineRow["status"];

const ORDER_CONFIG: Record<OrderStatus, { label: string; className: string }> =
  {
    pending: {
      label: "Pending",
      className: "bg-warn-bg text-warn-tx border-warn-tx/30",
    },
    ready: {
      label: "Ready",
      className: "bg-c50 text-coral-dk border-c100",
    },
    out_for_delivery: {
      label: "Out for Delivery",
      className: "bg-c100 text-coral-dk border-c200",
    },
    delivered: {
      label: "Delivered",
      className: "bg-success-bg text-success-tx border-success-tx/20",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-muted text-muted-foreground border-border",
    },
    delivery_failed: {
      label: "Delivery Failed",
      className: "bg-warn-bg text-warn-tx border-warn-tx/30",
    },
    refused: {
      label: "Refused",
      className: "bg-danger-bg text-danger-tx border-danger-tx/30",
    },
  };

const LINE_CONFIG: Record<LineStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-warn-bg text-warn-tx border-warn-tx/30",
  },
  at_factory: {
    label: "At Factory",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  allocated: {
    label: "Allocated",
    className: "bg-success-bg text-success-tx border-success-tx/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = ORDER_CONFIG[status];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

export function OrderLineStatusBadge({ status }: { status: LineStatus }) {
  const cfg = LINE_CONFIG[status];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
