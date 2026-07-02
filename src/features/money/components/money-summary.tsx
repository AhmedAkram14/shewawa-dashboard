"use client";

import { useMoneySnapshot } from "../hooks/use-money";

function formatEGP(piastres: number) {
  return `EGP ${(piastres / 100).toLocaleString("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "red" | "orange";
}) {
  const accentClass =
    accent === "green"
      ? "border-success-bg bg-success-bg"
      : accent === "red"
        ? "border-danger-bg bg-danger-bg"
        : accent === "orange"
          ? "border-warn-bg bg-warn-bg"
          : "";

  return (
    <div className={`rounded-lg border px-4 py-3 space-y-0.5 ${accentClass}`}>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums font-display">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function MoneySummary() {
  const { data, isLoading, error } = useMoneySnapshot();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-4">Loading…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-destructive p-4">
        {error instanceof Error ? error.message : "Failed to load."}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="text-2xl font-semibold leading-tight">Money</h1>

      {/* Summary cards */}
      <div className="space-y-2">
        <SummaryCard
          label="Money In"
          value={formatEGP(data.money_in)}
          sub="From delivered customer orders"
          accent="green"
        />
        <SummaryCard
          label="Money Out"
          value={formatEGP(data.money_out)}
          sub="Committed to placed factory orders"
          accent="red"
        />
        <SummaryCard
          label="At Risk"
          value={formatEGP(data.at_risk)}
          sub="Active orders not yet delivered"
          accent="orange"
        />
      </div>

      {/* Per-listing breakdown */}
      {data.by_listing.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">By Listing</h2>
          <div className="rounded-md border text-sm">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>Listing</span>
              <span className="text-right">In</span>
              <span className="text-right">Out</span>
              <span className="text-right">At Risk</span>
            </div>
            {data.by_listing.map((row) => (
              <div
                key={row.listing_id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b px-3 py-2.5 last:border-0"
              >
                <span className="truncate font-medium">{row.product_name}</span>
                <span className="text-right tabular-nums text-success-tx font-display">
                  {formatEGP(row.money_in)}
                </span>
                <span className="text-right tabular-nums text-danger-tx font-display">
                  {formatEGP(row.money_out)}
                </span>
                <span className="text-right tabular-nums text-warn-tx font-display">
                  {formatEGP(row.at_risk)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.by_listing.length === 0 && (
        <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
          No order data yet. Money will appear here once orders and deliveries
          are created.
        </p>
      )}
    </div>
  );
}
