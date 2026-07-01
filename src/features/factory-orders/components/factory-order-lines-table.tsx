import type { FactoryOrderLine } from "../api/factory-orders";

function formatCost(piastres: number) {
  return `EGP ${(piastres / 100).toFixed(2)}`;
}

export function FactoryOrderLinesTable({
  lines,
}: {
  lines: FactoryOrderLine[];
}) {
  if (lines.length === 0) {
    return (
      <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
        No lines — this listing had no active orders when the factory order was
        created.
      </p>
    );
  }

  const totalPieces = lines.reduce((s, l) => s + l.quantity, 0);
  const totalCost = lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);

  return (
    <div className="rounded-md border text-sm">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
        <span>Variant</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit cost</span>
        <span className="text-right">Total</span>
      </div>

      {/* Lines */}
      {lines.map((line) => (
        <div
          key={line.id}
          className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b px-3 py-2.5 last:border-0"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{line.product_variants.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {line.listings.products.name}
            </p>
          </div>
          <span className="self-center text-right">{line.quantity}</span>
          <span className="self-center text-right">
            {formatCost(line.unit_cost)}
          </span>
          <span className="self-center text-right font-medium">
            {formatCost(line.quantity * line.unit_cost)}
          </span>
        </div>
      ))}

      {/* Totals */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-t bg-muted/30 px-3 py-2 text-sm font-medium">
        <span>Total</span>
        <span className="text-right">{totalPieces} pcs</span>
        <span />
        <span className="text-right">{formatCost(totalCost)}</span>
      </div>
    </div>
  );
}
