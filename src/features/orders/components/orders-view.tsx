"use client";

import Link from "next/link";

import { formatPrice } from "@/lib/format";

import { useOrders } from "../hooks/use-orders";
import type { OrderWithCustomer } from "../api/orders";
import { OrderStatusBadge } from "./order-status-badge";

interface Props {
  initialData: OrderWithCustomer[];
}

function orderTotals(order: OrderWithCustomer) {
  const total = order.order_lines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price,
    0,
  );
  const pcs = order.order_lines.reduce((sum, l) => sum + l.quantity, 0);
  const balanceDue = Math.max(0, total - order.deposit_amount);
  return { total, pcs, balanceDue };
}

export function OrdersView({ initialData }: Props) {
  const { data: orders = [] } = useOrders(initialData);

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-semibold leading-tight">Orders</h1>

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No orders yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap + to create your first order
          </p>
        </div>
      ) : (
        <ul className="divide-y">
          {orders.map((order) => {
            const { total, pcs, balanceDue } = orderTotals(order);
            const date = new Date(order.created_at).toLocaleDateString(
              "en-EG",
              { day: "numeric", month: "short" },
            );
            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block py-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold">
                      #{order.order_number} — {order.customers.name}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                    {pcs > 0 && <span>{pcs} pcs</span>}
                    {total > 0 && (
                      <>
                        {pcs > 0 && <span>·</span>}
                        <span>EGP {formatPrice(total)}</span>
                      </>
                    )}
                    {balanceDue > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-foreground">
                          EGP {formatPrice(balanceDue)} due
                        </span>
                      </>
                    )}
                    <span className="ml-auto text-xs">{date}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
