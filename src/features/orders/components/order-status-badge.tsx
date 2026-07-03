import { Badge } from "@/components/ui/badge";

import type { OrderRow, OrderLineRow } from "../api/orders";

type OrderStatus = OrderRow["status"];
type LineStatus = OrderLineRow["status"];

const ORDER_CONFIG: Record<OrderStatus, { label: string; className: string }> =
  {
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    ready: {
      label: "Ready",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    out_for_delivery: {
      label: "Out for Delivery",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },
    delivered: {
      label: "Delivered",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-gray-100 text-gray-500 border-gray-200",
    },
  };

const LINE_CONFIG: Record<LineStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  at_factory: {
    label: "At Factory",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  allocated: {
    label: "Allocated",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-500 border-gray-200",
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
