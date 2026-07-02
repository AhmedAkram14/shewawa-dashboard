import { Badge } from "@/components/ui/badge";

import type { OrderRow, OrderLineRow } from "../api/orders";

type OrderStatus = OrderRow["status"];
type LineStatus = OrderLineRow["status"];

const ORDER_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ORDER_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  ready: "default",
  out_for_delivery: "default",
  delivered: "outline",
  cancelled: "destructive",
};

const LINE_LABELS: Record<LineStatus, string> = {
  pending: "Pending",
  at_factory: "At Factory",
  allocated: "Allocated",
  cancelled: "Cancelled",
};

const LINE_VARIANTS: Record<
  LineStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  at_factory: "default",
  allocated: "outline",
  cancelled: "destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_VARIANTS[status]}>{ORDER_LABELS[status]}</Badge>;
}

export function OrderLineStatusBadge({ status }: { status: LineStatus }) {
  return <Badge variant={LINE_VARIANTS[status]}>{LINE_LABELS[status]}</Badge>;
}
