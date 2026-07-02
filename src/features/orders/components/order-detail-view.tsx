"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format";

import { useOrder } from "../hooks/use-orders";
import type { OrderDetail } from "../api/orders";
import { OrderLineStatusBadge, OrderStatusBadge } from "./order-status-badge";

interface Props {
  id: string;
  initialData: OrderDetail;
}

export function OrderDetailView({ id, initialData }: Props) {
  const { data: order } = useOrder(id, initialData);

  if (!order) return null;

  const subtotal = order.order_lines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price,
    0,
  );
  const balance = Math.max(0, subtotal - order.deposit_amount);

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" render={<Link href="/orders" />}>
          <ArrowLeft />
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold leading-tight">
            Order #{order.order_number}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

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
                <div className="flex flex-col items-end gap-1 shrink-0">
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
      <section className="rounded-lg border divide-y">
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
    </div>
  );
}
