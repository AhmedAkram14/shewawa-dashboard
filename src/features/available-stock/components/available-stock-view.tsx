"use client";

import { ArrowLeft, PackageCheck, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { StockEntry } from "../api/available-stock";
import { useAvailableStock } from "../hooks/use-available-stock";
import { AllocateStockSheet } from "./allocate-stock-sheet";
import { AddStockSheet } from "./add-stock-sheet";

interface Props {
  initialData: StockEntry[];
}

type VariantGroup = {
  variantId: string;
  variantName: string;
  productName: string;
  totalQty: number;
  entries: StockEntry[];
};

function groupByVariant(entries: StockEntry[]): VariantGroup[] {
  const map = new Map<string, VariantGroup>();
  for (const e of entries) {
    const key = e.product_variant_id;
    if (!map.has(key)) {
      map.set(key, {
        variantId: key,
        variantName: e.product_variants.name,
        productName: e.product_variants.products.name,
        totalQty: 0,
        entries: [],
      });
    }
    const g = map.get(key)!;
    g.totalQty += e.quantity;
    g.entries.push(e);
  }
  return Array.from(map.values());
}

const SOURCE_CONFIG = {
  factory_surplus: {
    label: "Surplus",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  cancellation: {
    label: "Cancellation",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  manual: {
    label: "Manual",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
};

export function AvailableStockView({ initialData }: Props) {
  const router = useRouter();
  const { data: stock = [] } = useAvailableStock(initialData);
  const [allocating, setAllocating] = useState<StockEntry | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const groups = groupByVariant(stock);

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="flex-1 text-2xl font-semibold leading-tight">
          Available Stock
        </h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <PackageCheck className="h-12 w-12 text-green-500/60" />
          <p className="font-medium text-green-700">All delivered!</p>
          <p className="text-sm text-muted-foreground">
            No surplus stock. Every piece has been allocated or delivered.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {groups.map((group) => (
            <li key={group.variantId} className="rounded-lg border">
              {/* Variant header */}
              <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                <div>
                  <p className="font-medium">{group.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {group.variantName}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {group.totalQty} pcs
                </span>
              </div>

              {/* Individual entries */}
              <ul className="divide-y">
                {group.entries.map((entry) => {
                  const cfg =
                    SOURCE_CONFIG[entry.source] ?? SOURCE_CONFIG.manual;
                  const date = new Date(entry.created_at).toLocaleDateString(
                    "en-EG",
                    { day: "numeric", month: "short" },
                  );
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${cfg.className}`}
                        >
                          {cfg.label}
                        </Badge>
                        <span className="text-sm font-medium">
                          {entry.quantity} pcs
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {date}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAllocating(entry)}
                      >
                        Allocate
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <AllocateStockSheet
        stock={allocating}
        onOpenChange={(open) => {
          if (!open) setAllocating(null);
        }}
      />
      <AddStockSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
