"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format";

import { Package, Truck } from "lucide-react";
import { RecommendationList } from "@/features/workflow/recommendation-list";
import type { Recommendation } from "@/features/workflow/derive-recommendations";
import { StatusStepper } from "@/components/ui/status-stepper";
import { useOrder } from "../hooks/use-orders";
import type { OrderDetail } from "../api/orders";
import { OrderLineStatusBadge, OrderStatusBadge } from "./order-status-badge";
import { EditOrderSheet } from "./edit-order-sheet";
import { CancelOrderSheet } from "./cancel-order-sheet";

function getOrderRecommendations(order: OrderDetail): Recommendation[] {
  const recs: Recommendation[] = [];

  const pendingUnassigned = order.order_lines.filter(
    (l) => l.status === "pending" && l.factory_order_line_id === null,
  ).length;

  if (pendingUnassigned > 0) {
    recs.push({
      id: "send-to-factory",
      priority: 1,
      icon: Package,
      iconClass: "text-coral-dk",
      message: `${pendingUnassigned} line${pendingUnassigned !== 1 ? "s" : ""} in this order need${pendingUnassigned === 1 ? "s" : ""} to go to factory`,
      actionLabel: "Create Factory Order",
      href: "/factory-orders/new",
    });
  }

  if (order.status === "ready") {
    recs.push({
      id: "create-delivery",
      priority: 1,
      icon: Truck,
      iconClass: "text-primary",
      message: "This order is packed and ready for delivery",
      actionLabel: "Create Delivery",
      href: "/deliveries?new=1",
    });
  }

  return recs;
}

interface Props {
  id: string;
  initialData: OrderDetail;
}

export function OrderDetailView({ id, initialData }: Props) {
  const router = useRouter();
  const { data: order } = useOrder(id, initialData);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!order) return null;

  const subtotal = order.order_lines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price,
    0,
  );
  const balance = Math.max(0, subtotal - order.deposit_amount);

  const LOCKED_STATUSES = [
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "delivery_failed",
    "refused",
  ] as const;
  const canEdit = !LOCKED_STATUSES.includes(
    order.status as (typeof LOCKED_STATUSES)[number],
  );
  const canEditLines = order.order_lines.every(
    (l) => l.status === "pending" && l.factory_order_line_id === null,
  );
  const canCancel = order.status === "pending" || order.status === "ready";

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold leading-tight">
            Order #{order.order_number}
          </h1>
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.status} />
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(true)}
                aria-label="Edit order"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status stepper */}
      <StatusStepper
        steps={[
          { key: "pending", label: "Pending" },
          { key: "ready", label: "Ready" },
          { key: "out_for_delivery", label: "Out for Delivery" },
          { key: "delivered", label: "Delivered" },
        ]}
        currentKey={order.status}
        cancelledKey={["cancelled", "delivery_failed", "refused"]}
        cancelledLabel={
          order.status === "refused"
            ? "Refused"
            : order.status === "delivery_failed"
              ? "Delivery Failed"
              : "Cancelled"
        }
      />

      {/* Customer */}
      <section className="rounded-lg border p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Customer
        </p>
        <Link
          href={`/customers/${order.customer_id}`}
          className="mt-1 block font-medium hover:underline"
        >
          {order.customers.name}
        </Link>
        <p className="text-sm text-muted-foreground">
          {order.customers.address}
        </p>
        {order.customers.phone && (
          <p className="text-sm text-muted-foreground">
            {order.customers.phone}
          </p>
        )}
      </section>

      {/* Order lines */}
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Items
        </p>
        <ul className="divide-y rounded-lg border">
          {order.order_lines.map((line) => (
            <li key={line.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {line.product_variants.products.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {line.product_variants.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {line.quantity} × EGP {formatPrice(line.unit_price)}
                  </p>
                  {line.allocated_quantity > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {line.allocated_quantity} allocated
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-medium">
                    EGP {formatPrice(line.quantity * line.unit_price)}
                  </span>
                  <OrderLineStatusBadge status={line.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Totals */}
      <section className="divide-y rounded-lg border">
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-sm font-medium">
            EGP {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">Deposit</span>
          <span className="text-sm font-medium">
            EGP {formatPrice(order.deposit_amount)}
          </span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm font-medium">Balance Due</span>
          <span className="text-sm font-semibold">
            EGP {formatPrice(balance)}
          </span>
        </div>
      </section>

      {/* Notes */}
      {order.notes && (
        <section>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Notes
          </p>
          <p className="text-sm">{order.notes}</p>
        </section>
      )}

      <Separator />

      <p className="text-xs text-muted-foreground">
        Created {new Date(order.created_at).toLocaleString("en-EG")}
      </p>

      {canCancel && (
        <Button
          variant="outline"
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
          onClick={() => setCancelOpen(true)}
        >
          Cancel Order
        </Button>
      )}

      {(() => {
        const recs = getOrderRecommendations(order);
        return recs.length > 0 ? (
          <RecommendationList recommendations={recs} label="What's Next" />
        ) : null;
      })()}

      <EditOrderSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        order={order}
        canEditLines={canEditLines}
      />
      <CancelOrderSheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        order={order}
      />
    </div>
  );
}
