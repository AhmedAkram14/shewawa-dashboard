"use client";

import { ChevronLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { useOrdersByCustomer } from "@/features/orders/hooks/use-orders";

import { CustomerSheet } from "./customer-sheet";
import { useCustomer } from "../hooks/use-customers";
import type { CustomerRow } from "../api/customers";

interface Props {
  id: string;
  initialData: CustomerRow;
}

export function CustomerDetailView({ id, initialData }: Props) {
  const router = useRouter();
  const { data: customer } = useCustomer(id, initialData);
  const { data: orders = [], isLoading } = useOrdersByCustomer(id);
  const [editOpen, setEditOpen] = useState(false);

  if (!customer) return null;

  return (
    <div className="mx-auto max-w-lg p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ChevronLeft />
        </Button>
        <h1 className="flex-1 text-xl font-semibold leading-tight">
          {customer.name}
        </h1>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setEditOpen(true)}
        >
          <Pencil />
        </Button>
      </div>

      {/* Customer info */}
      <div className="space-y-3">
        <Row label="Address" value={customer.address} />
        {customer.phone && <Row label="Phone" value={customer.phone} />}
        {customer.notes && <Row label="Notes" value={customer.notes} />}
      </div>

      <Separator className="my-6" />

      {/* Order history */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Orders
      </h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => {
            const total = order.order_lines.reduce(
              (sum, l) => sum + l.quantity * l.unit_price,
              0,
            );
            const pcs = order.order_lines.reduce(
              (sum, l) => sum + l.quantity,
              0,
            );
            const balanceDue = Math.max(0, total - order.deposit_amount);
            const date = new Date(order.created_at).toLocaleDateString(
              "en-EG",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              },
            );
            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-xl border bg-card p-3 transition-all hover:border-primary/20 hover:shadow-sm active:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold leading-snug">
                        #{order.order_number}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {date}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  {pcs > 0 && (
                    <div className="mt-2 flex items-center gap-3 border-t pt-2 text-sm">
                      <span className="text-muted-foreground">{pcs} pcs</span>
                      <span className="text-muted-foreground">
                        EGP {formatPrice(total)}
                      </span>
                      {balanceDue > 0 ? (
                        <span className="ml-auto font-semibold text-coral-dk">
                          EGP {formatPrice(balanceDue)} due
                        </span>
                      ) : (
                        <span className="ml-auto text-xs text-success-tx">
                          Paid in full
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <CustomerSheet
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}
