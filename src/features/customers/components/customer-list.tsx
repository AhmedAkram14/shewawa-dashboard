"use client";

import Link from "next/link";

import { useCustomers } from "../hooks/use-customers";
import { AddCustomerSheet } from "./add-customer-sheet";
import type { CustomerRow } from "@/lib/supabase/database.types";

function CustomerCard({ customer }: { customer: CustomerRow }) {
  return (
    <Link
      href={`/customers/${customer.id}`}
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium truncate">{customer.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {customer.address}
          {customer.phone ? ` · ${customer.phone}` : ""}
        </p>
      </div>
      <span className="ml-3 text-muted-foreground shrink-0">→</span>
    </Link>
  );
}

export function CustomerList() {
  const { data: customers = [], isLoading, error } = useCustomers();

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load customers."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Customers
          {customers.length > 0 && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({customers.length})
            </span>
          )}
        </h1>
        <AddCustomerSheet />
      </div>

      {customers.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          No customers yet. Add one to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <CustomerCard key={c.id} customer={c} />
          ))}
        </div>
      )}
    </div>
  );
}
