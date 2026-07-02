"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { CustomerSheet } from "./customer-sheet";
import { useCustomers } from "../hooks/use-customers";
import type { CustomerRow } from "../api/customers";

interface Props {
  initialData: CustomerRow[];
}

export function CustomersView({ initialData }: Props) {
  const { data: customers = [] } = useCustomers(initialData);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-tight">Customers</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus />
          New
        </Button>
      </div>

      {customers.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-4 text-sm text-muted-foreground">No customers yet</p>
          <Button onClick={() => setAddOpen(true)}>
            Add your first customer
          </Button>
        </div>
      ) : (
        <ul className="divide-y">
          {customers.map((c) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className="flex items-center justify-between py-3 transition-colors hover:text-foreground"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.address}</p>
                </div>
                {c.phone && (
                  <span className="text-sm text-muted-foreground">
                    {c.phone}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CustomerSheet mode="add" open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
