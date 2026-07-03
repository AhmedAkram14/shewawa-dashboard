"use client";

import { ChevronLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { CustomerSheet } from "./customer-sheet";
import { useCustomer } from "../hooks/use-customers";
import type { CustomerRow } from "../api/customers";

interface Props {
  id: string;
  initialData: CustomerRow;
}

export function CustomerDetailView({ id, initialData }: Props) {
  const { data: customer } = useCustomer(id, initialData);
  const [editOpen, setEditOpen] = useState(false);

  if (!customer) return null;

  return (
    <div className="mx-auto max-w-lg p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={<Link href="/customers" />}
        >
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

      {/* Orders placeholder — filled in Milestone 3 */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Orders
      </h2>
      <p className="text-sm text-muted-foreground">
        Order history will appear here.
      </p>

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
