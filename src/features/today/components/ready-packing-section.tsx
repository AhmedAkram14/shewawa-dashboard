"use client";

import { useState } from "react";

import type { PackingCustomer } from "@/features/deliveries/api/deliveries";
import { CreateDeliverySheet } from "@/features/deliveries/components/create-delivery-sheet";
import { TodaySection } from "./today-section";

export function ReadyPackingSection({
  customers,
}: {
  customers: PackingCustomer[];
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState("");

  function openFor(customerId: string) {
    setActiveCustomerId(customerId);
    setSheetOpen(true);
  }

  return (
    <>
      <CreateDeliverySheet
        open={sheetOpen}
        onOpenChange={(v) => {
          setSheetOpen(v);
          if (!v) setActiveCustomerId("");
        }}
        defaultCustomerId={activeCustomerId}
      />
      <TodaySection
        title="Ready for Packing"
        count={customers.length}
        emptyText="No orders ready to pack."
      >
        <div className="space-y-1 px-4">
          {customers.map(({ customer, orders }) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => openFor(customer.id)}
              className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left hover:bg-accent active:bg-accent/80"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{customer.name}</p>
                {customer.phone && (
                  <p className="text-xs text-muted-foreground">
                    {customer.phone}
                  </p>
                )}
              </div>
              <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                {orders.length} item{orders.length !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
      </TodaySection>
    </>
  );
}
