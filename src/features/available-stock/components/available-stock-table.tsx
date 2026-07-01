"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAvailableStock,
  useUpdateAvailableStock,
} from "../hooks/use-available-stock";
import { STOCK_REASON_LABELS } from "../schemas";
import type { AvailableStockEntry } from "../api/available-stock";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EditRow({
  entry,
  onDone,
}: {
  entry: AvailableStockEntry;
  onDone: () => void;
}) {
  const [qty, setQty] = useState(String(entry.quantity));
  const [notes, setNotes] = useState(entry.notes ?? "");
  const update = useUpdateAvailableStock();

  async function save() {
    const quantity = parseInt(qty, 10);
    if (!quantity || quantity < 1) return;
    await update.mutateAsync({
      id: entry.id,
      input: { quantity, notes: notes || undefined },
    });
    onDone();
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-20"
      />
      <Input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes…"
        className="flex-1"
      />
      <Button size="sm" onClick={save} disabled={update.isPending}>
        Save
      </Button>
      <Button size="sm" variant="outline" onClick={onDone}>
        Cancel
      </Button>
    </div>
  );
}

function StockRow({ entry }: { entry: AvailableStockEntry }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="border-b last:border-0">
        <EditRow entry={entry} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b px-3 py-2.5 text-sm last:border-0">
      <div className="min-w-0">
        <p className="font-medium truncate">
          {entry.product_variants.products.name} — {entry.product_variants.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {STOCK_REASON_LABELS[entry.reason]} · {formatDate(entry.created_at)}
          {entry.listings ? ` · from ${entry.listings.products.name}` : ""}
        </p>
        {entry.notes && (
          <p className="text-xs text-muted-foreground italic">{entry.notes}</p>
        )}
      </div>
      <span className="text-right font-medium">{entry.quantity}</span>
      <span className="text-right text-xs text-muted-foreground">pcs</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={() => setEditing(true)}
      >
        Edit
      </Button>
    </div>
  );
}

export function AvailableStockTable() {
  const { data: stock = [], isLoading, error } = useAvailableStock();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading stock…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load stock."}
      </p>
    );
  }

  if (stock.length === 0) {
    return (
      <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
        No stock entries yet. Use &quot;Add to Stock&quot; to record available
        units.
      </p>
    );
  }

  return (
    <div className="rounded-md border text-sm">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
        <span>Product / Variant</span>
        <span className="text-right">Qty</span>
        <span />
        <span />
      </div>
      {stock.map((entry) => (
        <StockRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
