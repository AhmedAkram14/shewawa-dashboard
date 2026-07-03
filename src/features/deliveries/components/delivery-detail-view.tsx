"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format";

import { WorkflowRecommendations } from "@/features/workflow/workflow-recommendations";
import type { DeliveryDetail } from "../api/deliveries";
import { useDelivery } from "../hooks/use-deliveries";
import { useDispatchDelivery } from "../hooks/use-dispatch-delivery";
import { CompleteDeliverySheet } from "./complete-delivery-sheet";
import { DeliveryStatusBadge } from "./delivery-status-badge";

interface Props {
  id: string;
  initialData: DeliveryDetail;
}

export function DeliveryDetailView({ id, initialData }: Props) {
  const router = useRouter();
  const { data: delivery } = useDelivery(id, initialData);
  const dispatchMutation = useDispatchDelivery(id);

  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);

  if (!delivery) return null;

  const totalPcs = delivery.orders.reduce(
    (sum, o) => sum + o.order_lines.reduce((s, l) => s + l.quantity, 0),
    0,
  );
  const totalValue = delivery.orders.reduce(
    (sum, o) =>
      sum + o.order_lines.reduce((s, l) => s + l.quantity * l.unit_price, 0),
    0,
  );
  const totalDeposits = delivery.orders.reduce(
    (sum, o) => sum + o.deposit_amount,
    0,
  );
  const totalBalance = Math.max(0, totalValue - totalDeposits);

  const canDispatch = delivery.status === "pending";
  const canComplete =
    delivery.status === "pending" || delivery.status === "dispatched";

  function handleDispatch() {
    setDispatchError(null);
    dispatchMutation.mutate(undefined, {
      onError: (err) => setDispatchError(err.message),
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold leading-tight">
            Delivery #{delivery.delivery_number}
          </h1>
          <DeliveryStatusBadge status={delivery.status} />
        </div>
      </div>

      {/* Timestamps */}
      <section className="space-y-1 text-sm text-muted-foreground">
        <p>Created {new Date(delivery.created_at).toLocaleString("en-EG")}</p>
        {delivery.dispatched_at && (
          <p>
            Dispatched{" "}
            {new Date(delivery.dispatched_at).toLocaleString("en-EG")}
          </p>
        )}
      </section>

      {/* Orders */}
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Orders ({delivery.orders.length})
        </p>
        <ul className="divide-y rounded-lg border">
          {delivery.orders.map((order) => {
            const pcs = order.order_lines.reduce((s, l) => s + l.quantity, 0);
            const value = order.order_lines.reduce(
              (s, l) => s + l.quantity * l.unit_price,
              0,
            );
            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-3 hover:bg-muted/40"
                >
                  <div>
                    <p className="font-medium">{order.customers.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Order #{order.order_number} · {pcs} pcs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      EGP {formatPrice(value)}
                    </p>
                    {order.delivered_at && (
                      <p className="text-xs text-success-tx">Delivered</p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Totals */}
      <section className="divide-y rounded-lg border">
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">Total Pieces</span>
          <span className="text-sm font-medium">{totalPcs} pcs</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">Total Value</span>
          <span className="text-sm font-medium">
            EGP {formatPrice(totalValue)}
          </span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">
            Collected Deposits
          </span>
          <span className="text-sm font-medium">
            EGP {formatPrice(totalDeposits)}
          </span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm font-medium">Balance to Collect</span>
          <span className="text-sm font-semibold">
            EGP {formatPrice(totalBalance)}
          </span>
        </div>
      </section>

      {delivery.notes && (
        <section>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Notes
          </p>
          <p className="text-sm">{delivery.notes}</p>
        </section>
      )}

      {/* Actions */}
      {(canDispatch || canComplete) && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            {dispatchError && (
              <p className="text-sm text-destructive">{dispatchError}</p>
            )}
            {canDispatch && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDispatch}
                disabled={dispatchMutation.isPending}
              >
                {dispatchMutation.isPending
                  ? "Dispatching…"
                  : "Mark Dispatched"}
              </Button>
            )}
            {canComplete && (
              <Button
                className="w-full"
                onClick={() => setCompleteOpen(true)}
                disabled={dispatchMutation.isPending}
              >
                Complete Delivery
              </Button>
            )}
          </div>
        </>
      )}

      {delivery.status === "completed" && (
        <WorkflowRecommendations limit={1} label="What's Next" />
      )}

      <CompleteDeliverySheet
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        deliveryId={id}
        orders={delivery.orders}
      />
    </div>
  );
}
