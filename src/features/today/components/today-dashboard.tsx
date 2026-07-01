"use client";

import { useTodaySnapshot } from "../hooks/use-today";
import { DeliveredTodaySection } from "./delivered-today-section";
import { KpiStrip } from "./kpi-strip";
import { NeedsAttentionSection } from "./needs-attention-section";
import { OutDeliverySection } from "./out-delivery-section";
import { QuickActionsBar } from "./quick-actions-bar";
import { ReadyPackingSection } from "./ready-packing-section";
import { WaitingFactorySection } from "./waiting-factory-section";

function TodayHeader() {
  const date = new Date().toLocaleDateString("en-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-4">
      <h1 className="text-xl font-semibold">Today</h1>
      <p className="text-sm text-muted-foreground">{date}</p>
    </div>
  );
}

export function TodayDashboard() {
  const { data, isLoading, error } = useTodaySnapshot();

  if (isLoading) {
    return <p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>;
  }

  if (error || !data) {
    return (
      <p className="px-4 py-8 text-sm text-destructive">
        {error instanceof Error
          ? error.message
          : "Failed to load today's data."}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <TodayHeader />
      <KpiStrip kpis={data.kpis} />
      <QuickActionsBar />
      <NeedsAttentionSection items={data.needs_attention} />
      <WaitingFactorySection orders={data.waiting_factory} />
      <div id="ready-packing">
        <ReadyPackingSection customers={data.ready_packing} />
      </div>
      <div id="out-delivery">
        <OutDeliverySection deliveries={data.out_for_delivery} />
      </div>
      <div id="delivered-today">
        <DeliveredTodaySection deliveries={data.delivered_today} />
      </div>
    </div>
  );
}
