"use client";

import Link from "next/link";

import { formatPrice } from "@/lib/format";

import { useOrders } from "../hooks/use-orders";
import type { OrderWithCustomer } from "../api/orders";
import { OrderStatusBadge } from "./order-status-badge";

interface Props {
  initialData: OrderWithCustomer[];
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
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center justify-between py-3 transition-colors hover:text-foreground"
              >
                <div>
                  <p className="font-medium">
                    #{order.order_number} — {order.customers.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-EG")}
                    {order.deposit_amount > 0 && (
                      <> · EGP {formatPrice(order.deposit_amount)} deposit</>
                    )}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
