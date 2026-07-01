"use client";

import { PackagePlus, Plus } from "lucide-react";
import { useState } from "react";

import { AddStockSheet } from "@/features/available-stock/components/add-stock-sheet";
import { NewOrderSheet } from "@/features/orders/components/new-order-sheet";
import { Button } from "@/components/ui/button";

export function QuickActionsBar() {
  const [orderOpen, setOrderOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);

  return (
    <div className="flex gap-2 px-4">
      <NewOrderSheet open={orderOpen} onOpenChange={setOrderOpen} />
      <AddStockSheet open={stockOpen} onOpenChange={setStockOpen} />

      <Button onClick={() => setOrderOpen(true)} className="flex-1 gap-2">
        <Plus className="h-4 w-4" />
        New Order
      </Button>
      <Button
        variant="outline"
        onClick={() => setStockOpen(true)}
        className="flex-1 gap-2"
      >
        <PackagePlus className="h-4 w-4" />
        Add to Stock
      </Button>
    </div>
  );
}
